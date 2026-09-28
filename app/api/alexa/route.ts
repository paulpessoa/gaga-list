import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { verifyAlexaRequest } from '@/lib/alexa/verify-request';
import { cleanName, formatBRL, joinPt, pickCandidate, resolveList, type AlexaList } from '@/lib/alexa/speech';

export const runtime = 'nodejs';

// Configuração do Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_ITEMS_SPOKEN = 10;

// Schema Zod para forçar a saída estruturada do LLM
const AlexaIntentSchema = z.object({
  action: z.enum([
    "ADD_ITEM",
    "LIST_ITEMS",
    "REMOVE_ITEM",
    "CHECK_ITEM",
    "UNCHECK_ITEM",
    "UPDATE_ITEM",
    "CALCULATE_TOTAL",
    "SEARCH_ITEM",
    "UNDO_ACTION",
    "END_SESSION",
    "UNKNOWN"
  ]),
  item: z.string().nullable().describe("O nome do item mencionado"),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
  })).describe("Só em ADD_ITEM: TODOS os produtos citados, um por produto. Nas outras ações, []"),
  listName: z.string().nullable().describe("O nome da lista de origem"),
  targetListName: z.string().nullable().describe("A lista de destino (caso peça para mover/trocar)"),
  price: z.number().nullable().describe("Preço do item"),
  quantity: z.number().nullable().describe("Quantidade"),
  unit: z.string().nullable().describe("Unidade de medida (kg, litros, caixas)"),
  category: z.string().nullable().describe("Categoria do item (limpeza, açougue, frios)"),
  newName: z.string().nullable().describe("Novo nome para o item se for renomear"),
  statusFilter: z.enum(["purchased", "pending", "all"]).nullable().describe("Filtro de itens: 'purchased' para comprados, 'pending' para faltando, 'all' para todos"),
  notes: z.string().nullable().describe("Qualquer observação adicional sobre o item (urgência, marca, etc)."),
  naturalResponse: z.string().describe("Fala curta, usada só em UNKNOWN e END_SESSION. Vazio nas outras ações."),
});

type ParsedAlexaIntent = z.infer<typeof AlexaIntentSchema>;

type UndoEntry =
  | { kind: 'delete'; ids: string[]; label: string }
  | { kind: 'update'; id: string; fields: Record<string, unknown>; label: string }
  | { kind: 'insert'; row: Record<string, unknown>; label: string };

type SessionState = {
  lastListId?: string | null;
  pending?: { intent: ParsedAlexaIntent; candidates: AlexaList[] };
  undo?: UndoEntry;
};

/**
 * Função Core do Agente: o LLM só INTERPRETA a frase. O que a Alexa fala
 * sai do resultado real no banco (evita confirmar algo que não aconteceu).
 */
async function processUserUtterance(rawText: string, listTitles: string[]): Promise<ParsedAlexaIntent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Baixa latência é obrigatória para a Alexa (máx 8s)
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Você é o agente inteligente do aplicativo Gaga List. Extraia a intenção do usuário rigorosamente.
Regras de Classificação OBRIGATÓRIAS:
- ADD_ITEM: Inserir, anotar, colocar, adicionar algo novo na lista. Preencha 'items' com CADA produto citado ("arroz e leite" = 2 itens).
- CHECK_ITEM: Marcar como comprado, riscar, já comprei, peguei.
- UNCHECK_ITEM: Desmarcar, voltar para pendente, faltou comprar.
- REMOVE_ITEM: Apagar, excluir, tirar, remover da lista.
- UPDATE_ITEM: Trocar preço, mudar quantidade, alterar medida, renomear item, mudar categoria, ou MOVER para outra lista (usa targetListName).
- LIST_ITEMS: Ler itens (faltando/comprados/todos por statusFilter ou categoria) ou ler as listas do usuário.
- CALCULATE_TOTAL: Somatório da lista ou de uma categoria, saber quanto vai dar a compra.
- SEARCH_ITEM: Pesquisar se um item está na lista.
- UNDO_ACTION: Desfazer a última ação ("desfaz", "volta", "cancela o que fiz").
- END_SESSION: "só isso", "nada", "tchau", "encerrar", "pronto".
- UNKNOWN: Assuntos que não tem nada a ver com listas de compras/tarefas.

Listas do usuário: ${listTitles.length ? listTitles.map((t) => `"${t}"`).join(", ") : "(nenhuma)"}.
Em listName/targetListName, se o usuário se referir a uma dessas listas, devolva o título EXATO dela. "minha lista", "a lista" ou nenhuma lista citada = null (JSON null, nunca o texto "null").
'item' é só o nome do produto, no singular ou plural como foi dito, sem quantidade.
'naturalResponse' só é usada em UNKNOWN (explique em uma frase curta o que a skill faz) e END_SESSION (despedida curta). Nas outras ações devolva "".`
      },
      { role: "user", content: rawText }
    ],
    response_format: zodResponseFormat(AlexaIntentSchema, "alexa_intent"),
  });

  const parsed = JSON.parse(completion.choices[0].message.content!) as ParsedAlexaIntent;
  return {
    ...parsed,
    item: cleanName(parsed.item),
    listName: cleanName(parsed.listName),
    targetListName: cleanName(parsed.targetListName),
    newName: cleanName(parsed.newName),
    unit: cleanName(parsed.unit),
    category: cleanName(parsed.category),
    notes: cleanName(parsed.notes),
    items: (parsed.items || []).filter((i) => cleanName(i.name)),
  };
}

/** Lista "em uso": a da conversa atual, senão a que teve item mexido por último, senão a mais recente. */
async function findDefaultList(supabase: SupabaseClient, lists: AlexaList[], lastListId?: string | null): Promise<AlexaList | null> {
  const fromSession = lists.find((l) => l.id === lastListId);
  if (fromSession) return fromSession;
  const { data } = await supabase
    .from('items')
    .select('list_id, lists!inner(deleted_at)')
    .is('lists.deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1);
  const recentId = data?.[0]?.list_id;
  return lists.find((l) => l.id === recentId) || lists[0] || null;
}

export async function POST(req: Request) {
  // Corpo bruto é necessário para validar a assinatura da Amazon
  const rawBody = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    await verifyAlexaRequest(rawBody, body, req.headers);
  } catch (err) {
    console.warn("Alexa: requisição rejeitada:", (err as Error).message);
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    const { request, session } = body;
    const sessionAttributes: SessionState = session?.attributes || {};

    // Não logar o body inteiro: ele contém o accessToken do usuário
    console.log("Alexa Request:", request?.type, request?.intent?.name ?? "", request?.requestId);

    if (request?.type === 'SessionEndedRequest') {
      // A Amazon não aceita fala em resposta a SessionEndedRequest
      return NextResponse.json({ version: "1.0", response: {} });
    }

    if (request?.type === 'IntentRequest') {
      const intentName = request.intent.name;
      if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.NoIntent' || intentName === 'AMAZON.NavigateHomeIntent') {
        return respondWithAlexa("Até a próxima!", true);
      }
      if (intentName === 'AMAZON.HelpIntent') {
        return respondWithAlexa("Você pode dizer, por exemplo: anotar leite no mercado, já comprei o pão, o que falta na lista de mercado, ou quanto deu a lista. O que você quer fazer?", false, sessionAttributes);
      }
      if (intentName === 'AMAZON.FallbackIntent') {
        return respondWithAlexa("Não entendi. Tente algo como: anotar arroz na lista de mercado.", false, sessionAttributes);
      }
      if (intentName === 'AMAZON.YesIntent') {
        return respondWithAlexa("Pode falar!", false, sessionAttributes);
      }
    }

    const accessToken = session?.user?.accessToken;
    if (!accessToken) return linkAccountResponse();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    // Autenticação e listas em paralelo (RLS já inclui as listas compartilhadas)
    const [{ data: { user } }, { data: listRows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('lists').select('id, title').is('deleted_at', null).order('updated_at', { ascending: false }),
    ]);
    if (!user) return linkAccountResponse();
    const USER_ID = user.id;
    const lists: AlexaList[] = listRows || [];

    if (request?.type === 'LaunchRequest') {
      return respondWithAlexa("Opa, Gaga List na escuta! O que você precisa anotar?", false);
    }

    let rawText = "";
    if (request?.type === 'IntentRequest') {
      rawText = request.intent.slots?.Query?.value || "";
    }

    if (!rawText) {
      return respondWithAlexa("Desculpe, não ouvi direito. O que você quer fazer?", false, sessionAttributes);
    }

    // Resposta ao "de qual lista?": resolve sem LLM e retoma a ação original (com quantidade, preço etc.)
    let intentData: ParsedAlexaIntent;
    let chosenList: AlexaList | null = null;
    const pending = sessionAttributes.pending;
    const pendingChoice = pending ? pickCandidate(rawText, pending.candidates) : null;

    const defaultListPromise = findDefaultList(supabase, lists, sessionAttributes.lastListId);
    if (pending && pendingChoice) {
      intentData = pending.intent;
      chosenList = lists.find((l) => l.id === pendingChoice.id) || pendingChoice;
    } else {
      intentData = await processUserUtterance(rawText, lists.map((l) => l.title));
    }
    const defaultList = await defaultListPromise;
    console.log("Agente:", intentData.action, "| lista:", chosenList?.title ?? intentData.listName ?? "-", pending ? `| pendente: ${pendingChoice ? 'resolvido' : 'descartado'}` : "");

    const namedList = chosenList || resolveList(intentData.listName, lists);
    const moveList = resolveList(intentData.targetListName, lists);

    // Sessão iniciada já com o comando ("Alexa, pede pro gaga list anotar leite"): executa e encerra
    const oneShot = session?.new === true;
    const nextState = (lastListId?: string | null, undo?: UndoEntry | null): SessionState => ({
      lastListId: lastListId || sessionAttributes.lastListId || null,
      ...(undo === null ? {} : { undo: undo || sessionAttributes.undo }),
    });
    const done = (text: string, lastListId?: string | null, undo?: UndoEntry | null) =>
      oneShot ? respondWithAlexa(text, true) : respondWithAlexa(`${text} Algo mais?`, false, nextState(lastListId, undo));
    const askWhichList = (text: string, candidates: AlexaList[]) =>
      respondWithAlexa(text, false, { ...nextState(), pending: { intent: intentData, candidates } });

    async function snapshot(id: string, keys: string[]): Promise<Record<string, unknown>> {
      const { data, error } = await supabase.from('items').select(keys.join(', ')).eq('id', id).single();
      if (error) throw error;
      return data as unknown as Record<string, unknown>;
    }

    if (intentData.action === "END_SESSION") {
      return respondWithAlexa(intentData.naturalResponse || "Até a próxima!", true);
    }

    if (intentData.action === "UNKNOWN") {
      return respondWithAlexa(intentData.naturalResponse || "Eu cuido das suas listas do Gaga List. Diga, por exemplo: anotar leite.", false, nextState());
    }

    if (intentData.action === "UNDO_ACTION") {
      const undo = sessionAttributes.undo;
      if (!undo) return done("Não tenho nada para desfazer nesta conversa.");
      if (undo.kind === 'delete') {
        const { error } = await supabase.from('items').delete().in('id', undo.ids);
        if (error) throw error;
      } else if (undo.kind === 'update') {
        const { error } = await supabase.from('items').update(undo.fields).eq('id', undo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('items').insert(undo.row);
        if (error) throw error;
      }
      return done(`Desfiz ${undo.label}.`, undefined, null);
    }

    if (intentData.listName && !namedList && intentData.action !== "ADD_ITEM") {
      return done(`Não achei a lista ${intentData.listName}.`);
    }

    // Busca o item. Sem lista citada, prefere a lista em uso; só pergunta se estiver só em outras listas.
    async function getTargetItem(statusFilter: boolean | null = null) {
      const term = (intentData.item || "").replace(/[%_,()]/g, "");
      let query = supabase
        .from('items')
        .select('id, name, list_id, lists!inner(title, deleted_at)')
        .ilike('name', `%${term}%`)
        .is('lists.deleted_at', null);
      if (namedList) query = query.eq('list_id', namedList.id);
      if (statusFilter !== null) query = query.eq('is_purchased', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      const found = (data || []).map((i: any) => ({ id: i.id as string, name: i.name as string, listId: i.list_id as string, listTitle: (i.lists?.title as string) || 'Sem nome' }));
      const pick = (items: typeof found) => items.find((i) => i.name.toLowerCase() === term.toLowerCase()) || items[0];

      const inCurrent = !namedList && defaultList ? found.filter((i) => i.listId === defaultList.id) : [];
      if (inCurrent.length) return { match: pick(inCurrent), candidates: [] as AlexaList[], listTitles: [defaultList!.title] };

      const candidates = [...new Map(found.map((i) => [i.listId, { id: i.listId, title: i.listTitle }])).values()];
      return {
        match: candidates.length === 1 ? pick(found) : null,
        candidates: candidates.length > 1 ? candidates : [],
        listTitles: candidates.map((c) => c.title),
      };
    }

    // Handlers
    const addItems = intentData.items?.length
      ? intentData.items
      : intentData.item ? [{ name: intentData.item, quantity: intentData.quantity, unit: intentData.unit }] : [];

    if (intentData.action === "ADD_ITEM" && addItems.length) {
      let list = namedList;
      if (!list && intentData.listName) {
        const { data: newList, error } = await supabase.from('lists').insert({ title: intentData.listName, owner_id: USER_ID }).select('id, title').single();
        if (error) throw error;
        list = newList;
      }
      list = list || defaultList;
      if (!list) {
        return done("Você ainda não tem nenhuma lista. Diga, por exemplo: anotar leite na lista de mercado.");
      }

      const single = addItems.length === 1;
      const { data: inserted, error } = await supabase.from('items').insert(addItems.map((it) => ({
        name: it.name,
        list_id: list!.id,
        added_by: USER_ID,
        quantity: it.quantity || 1,
        unit: it.unit || null,
        price: single ? intentData.price || null : null,
        category: single ? intentData.category || null : null,
        notes: single ? intentData.notes || null : null,
      }))).select('id');
      if (error) throw error;
      const names = joinPt(addItems.map((it) => it.name));
      return done(`Anotei ${names} na lista ${list.title}.`, list.id, { kind: 'delete', ids: (inserted || []).map((r) => r.id), label: `a anotação de ${names}` });
    }

    if (intentData.action === "CHECK_ITEM" && intentData.item) {
      const { match, candidates } = await getTargetItem(false);
      if (candidates.length) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(candidates.map((c) => c.title))}. De qual você quer riscar?`, candidates);
      if (!match) return done(`Não achei ${intentData.item} pendente.`);
      const before = await snapshot(match.id, ['is_purchased', 'checked_by', 'checked_at']);
      const { error } = await supabase.from('items').update({ is_purchased: true, checked_by: USER_ID, checked_at: new Date().toISOString() }).eq('id', match.id);
      if (error) throw error;
      return done(`Risquei ${match.name} da lista ${match.listTitle}.`, match.listId, { kind: 'update', id: match.id, fields: before, label: `o risco de ${match.name}` });
    }

    if (intentData.action === "UNCHECK_ITEM" && intentData.item) {
      const { match, candidates } = await getTargetItem(true);
      if (candidates.length) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(candidates.map((c) => c.title))}. Qual quer desmarcar?`, candidates);
      if (!match) return done(`Não achei ${intentData.item} comprado para desmarcar.`);
      const before = await snapshot(match.id, ['is_purchased', 'checked_by', 'checked_at']);
      const { error } = await supabase.from('items').update({ is_purchased: false, checked_by: null, checked_at: null }).eq('id', match.id);
      if (error) throw error;
      return done(`Voltei ${match.name} para pendente na lista ${match.listTitle}.`, match.listId, { kind: 'update', id: match.id, fields: before, label: `a volta de ${match.name} para pendente` });
    }

    if (intentData.action === "REMOVE_ITEM" && intentData.item) {
      const { match, candidates } = await getTargetItem(null);
      if (candidates.length) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(candidates.map((c) => c.title))}. De qual quer excluir?`, candidates);
      if (!match) return done(`Não achei ${intentData.item} para excluir.`);
      const { data: row, error: readError } = await supabase.from('items').select('*').eq('id', match.id).single();
      if (readError) throw readError;
      const { error } = await supabase.from('items').delete().eq('id', match.id);
      if (error) throw error;
      return done(`Tirei ${match.name} da lista ${match.listTitle}.`, match.listId, { kind: 'insert', row, label: `a exclusão de ${match.name}` });
    }

    if (intentData.action === "UPDATE_ITEM" && intentData.item) {
      if (intentData.targetListName && !moveList) return done(`Não achei a lista ${intentData.targetListName}.`);
      const { match, candidates } = await getTargetItem(null);
      if (candidates.length) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(candidates.map((c) => c.title))}. De qual quer alterar?`, candidates);
      if (!match) return done(`Não achei ${intentData.item} para atualizar.`);

      const updatePayload: Record<string, unknown> = {};
      if (intentData.price !== null) updatePayload.price = intentData.price;
      if (intentData.quantity !== null) updatePayload.quantity = intentData.quantity;
      if (intentData.unit !== null) updatePayload.unit = intentData.unit;
      if (intentData.category !== null) updatePayload.category = intentData.category;
      if (intentData.newName !== null) updatePayload.name = intentData.newName;
      if (moveList) updatePayload.list_id = moveList.id;

      if (Object.keys(updatePayload).length === 0) return done(`Não entendi o que mudar em ${match.name}.`);
      const before = await snapshot(match.id, Object.keys(updatePayload));
      const { error } = await supabase.from('items').update(updatePayload).eq('id', match.id);
      if (error) throw error;
      return done(
        moveList ? `Movi ${match.name} para a lista ${moveList.title}.` : `Atualizei ${match.name} na lista ${match.listTitle}.`,
        moveList?.id || match.listId,
        { kind: 'update', id: match.id, fields: before, label: `a alteração de ${match.name}` }
      );
    }

    if (intentData.action === "SEARCH_ITEM" && intentData.item) {
      const { listTitles } = await getTargetItem(null);
      if (listTitles.length === 0) return done(`Não achei ${intentData.item} em nenhuma lista.`);
      return done(`Sim, ${intentData.item} está na lista ${joinPt(listTitles)}.`);
    }

    if (intentData.action === "CALCULATE_TOTAL") {
      const list = namedList || defaultList;
      if (!list) return done("Você ainda não tem nenhuma lista.");
      let q = supabase.from('items').select('price, quantity').eq('list_id', list.id);
      if (intentData.statusFilter === 'purchased') q = q.eq('is_purchased', true);
      if (intentData.statusFilter === 'pending') q = q.eq('is_purchased', false);
      if (intentData.category) q = q.ilike('category', `%${intentData.category}%`);
      const { data: listItems, error } = await q;
      if (error) throw error;

      const priced = (listItems || []).filter((i) => i.price != null);
      const total = priced.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
      const scope = intentData.statusFilter === 'purchased' ? 'dos itens comprados ' : intentData.statusFilter === 'pending' ? 'do que falta ' : '';
      if (priced.length === 0) return done(`Nenhum item da lista ${list.title} tem preço ainda.`, list.id);
      const missing = (listItems || []).length - priced.length;
      const note = missing > 0 ? ` ${missing === 1 ? 'Um item está' : `${missing} itens estão`} sem preço.` : '';
      return done(`O total ${scope}da lista ${list.title} é ${formatBRL(total)}.${note}`, list.id);
    }

    if (intentData.action === "LIST_ITEMS") {
      // Sem lista citada e sem filtro: lê os nomes das listas
      const list = namedList || (intentData.statusFilter || intentData.category ? defaultList : null);
      if (list) {
        let q = supabase.from('items').select('name').eq('list_id', list.id).order('created_at', { ascending: true });
        if (intentData.statusFilter === 'purchased') q = q.eq('is_purchased', true);
        if (intentData.statusFilter === 'pending') q = q.eq('is_purchased', false);
        if (intentData.category) q = q.ilike('category', `%${intentData.category}%`);

        const { data: listItems, error } = await q;
        if (error) throw error;
        if (!listItems || listItems.length === 0) return done(`Não encontrei itens com esse critério na lista ${list.title}.`, list.id);
        const names = listItems.slice(0, MAX_ITEMS_SPOKEN).map((i) => i.name);
        const rest = listItems.length - names.length;
        const spoken = rest > 0 ? `${names.join(', ')}, e mais ${rest}` : joinPt(names);
        return done(`Na lista ${list.title} você tem: ${spoken}.`, list.id);
      }

      if (lists.length === 0) return done("Você não tem nenhuma lista cadastrada.");
      const titles = lists.map((l) => l.title);
      return done(lists.length === 1 ? `Você tem a lista ${titles[0]}.` : `Você tem ${lists.length} listas: ${joinPt(titles)}.`);
    }

    // Ação reconhecida, mas faltou o item (ex.: "anotar na lista de mercado")
    return respondWithAlexa("Qual item?", false, nextState());

  } catch (error) {
    console.error("Erro Fatal no Agente Alexa:", error);
    return respondWithAlexa("Nossa, deu um curto circuito aqui na minha inteligência. Pode tentar de novo?", false);
  }
}

function respondWithAlexa(text: string, shouldEndSession = false, sessionAttributes: object = {}) {
  return NextResponse.json({
    version: "1.0",
    sessionAttributes: sessionAttributes || {},
    response: {
      outputSpeech: { type: "PlainText", text },
      // A certificação exige reprompt sempre que a sessão fica aberta
      ...(!shouldEndSession && {
        reprompt: { outputSpeech: { type: "PlainText", text: "Quer fazer mais alguma coisa na sua lista?" } }
      }),
      shouldEndSession
    }
  });
}

// Sem token (ou token inválido): o card LinkAccount aparece no app da Alexa com o botão de vincular
function linkAccountResponse() {
  return NextResponse.json({
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text: "Para usar o Gaga List, vincule sua conta no aplicativo da Alexa. Mandei um cartão lá com o passo a passo." },
      card: { type: "LinkAccount" },
      shouldEndSession: true
    }
  });
}
