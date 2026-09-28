import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { verifyAlexaRequest } from '@/lib/alexa/verify-request';
import { formatBRL, joinPt, resolveList, type AlexaList } from '@/lib/alexa/speech';

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
- ADD_ITEM: Inserir, anotar, colocar, adicionar algo novo na lista.
- CHECK_ITEM: Marcar como comprado, riscar, já comprei, peguei.
- UNCHECK_ITEM: Desmarcar, voltar para pendente, faltou comprar.
- REMOVE_ITEM: Apagar, excluir, tirar, remover da lista.
- UPDATE_ITEM: Trocar preço, mudar quantidade, alterar medida, renomear item, mudar categoria, ou MOVER para outra lista (usa targetListName).
- LIST_ITEMS: Ler itens (faltando/comprados/todos por statusFilter ou categoria) ou ler as listas do usuário.
- CALCULATE_TOTAL: Somatório da lista ou de uma categoria, saber quanto vai dar a compra.
- SEARCH_ITEM: Pesquisar se um item está na lista.
- UNDO_ACTION: Desfazer a última ação.
- END_SESSION: "só isso", "nada", "tchau", "encerrar", "pronto".
- UNKNOWN: Assuntos que não tem nada a ver com listas de compras/tarefas.

Listas do usuário: ${listTitles.length ? listTitles.map((t) => `"${t}"`).join(", ") : "(nenhuma)"}.
Em listName/targetListName, se o usuário se referir a uma dessas listas, devolva o título EXATO dela. Se não citar lista, use null.
'item' é só o nome do produto, no singular ou plural como foi dito, sem quantidade.
'naturalResponse' só é usada em UNKNOWN (explique em uma frase curta o que a skill faz) e END_SESSION (despedida curta). Nas outras ações devolva "".`
      },
      { role: "user", content: rawText }
    ],
    response_format: zodResponseFormat(AlexaIntentSchema, "alexa_intent"),
  });

  return JSON.parse(completion.choices[0].message.content!) as ParsedAlexaIntent;
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
        return respondWithAlexa("Você pode dizer, por exemplo: anotar leite no mercado, já comprei o pão, o que falta na lista de mercado, ou quanto deu a lista. O que você quer fazer?", false, session?.attributes);
      }
      if (intentName === 'AMAZON.FallbackIntent') {
        return respondWithAlexa("Não entendi. Tente algo como: anotar arroz na lista de mercado.", false, session?.attributes);
      }
      if (intentName === 'AMAZON.YesIntent') {
        return respondWithAlexa("Pode falar!", false, session?.attributes);
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

    const sessionAttributes = session?.attributes || {};

    if (!rawText) {
      return respondWithAlexa("Desculpe, não ouvi direito. O que você quer fazer?", false, sessionAttributes);
    }

    let promptText = rawText;
    if (sessionAttributes.pendingAction && sessionAttributes.pendingItem) {
      promptText = `[Contexto da conversa anterior: O usuário tentava a ação ${sessionAttributes.pendingAction} no item "${sessionAttributes.pendingItem}". Ele responde à pergunta de qual lista usar.] Resposta do usuário: "${rawText}"`;
    }

    const intentData = await processUserUtterance(promptText, lists.map((l) => l.title));
    console.log("Agente:", intentData.action, "| lista:", intentData.listName ?? "-");

    // Lista padrão quando o usuário não cita nenhuma: a última usada na sessão, senão a mais recente
    const defaultList = lists.find((l) => l.id === sessionAttributes.lastListId) || lists[0] || null;
    const namedList = resolveList(intentData.listName, lists);
    const moveList = resolveList(intentData.targetListName, lists);

    // Sessão iniciada já com o comando ("Alexa, pede pro gaga list anotar leite"): executa e encerra
    const oneShot = session?.new === true;
    const attrs = (lastListId?: string | null) => ({ lastListId: lastListId || sessionAttributes.lastListId || null });
    const done = (text: string, lastListId?: string | null) =>
      oneShot ? respondWithAlexa(text, true) : respondWithAlexa(`${text} Algo mais?`, false, attrs(lastListId));
    const askWhichList = (text: string) =>
      respondWithAlexa(text, false, { ...attrs(), pendingAction: intentData.action, pendingItem: intentData.item });

    if (intentData.action === "END_SESSION") {
      return respondWithAlexa(intentData.naturalResponse || "Até a próxima!", true);
    }

    if (intentData.action === "UNKNOWN") {
      return respondWithAlexa(intentData.naturalResponse || "Eu cuido das suas listas do Gaga List. Diga, por exemplo: anotar leite.", false, attrs());
    }

    if (intentData.action === "UNDO_ACTION") {
      return respondWithAlexa("Eu ainda estou aprendendo a desfazer ações automáticas, mas você pode me pedir diretamente para reverter o que foi feito, como 'desmarcar o item' ou 'apagar o item'!", false, attrs());
    }

    if (intentData.listName && !namedList && intentData.action !== "ADD_ITEM") {
      return done(`Não achei a lista ${intentData.listName}.`);
    }

    // Busca o item nas listas ativas. Se houver mais de um em listas diferentes, pergunta qual.
    async function getTargetItem(statusFilter: boolean | null = null) {
      const term = (intentData.item || "").replace(/[%_]/g, "");
      let query = supabase
        .from('items')
        .select('id, name, list_id, lists!inner(title, deleted_at)')
        .ilike('name', `%${term}%`)
        .is('lists.deleted_at', null);
      if (namedList) query = query.eq('list_id', namedList.id);
      if (statusFilter !== null) query = query.eq('is_purchased', statusFilter);

      const { data } = await query;
      const found = (data || []).map((i: any) => ({ id: i.id as string, name: i.name as string, listId: i.list_id as string, listTitle: (i.lists?.title as string) || 'Sem nome' }));
      const listTitles = [...new Set(found.map((i) => i.listTitle))];
      const exact = found.find((i) => i.name.toLowerCase() === term.toLowerCase());
      return {
        // Mesmo item em uma lista só (ou nome exato): não precisa perguntar
        match: listTitles.length === 1 ? (exact || found[0]) : null,
        ambiguous: listTitles.length > 1,
        listTitles,
      };
    }

    // Handlers
    if (intentData.action === "ADD_ITEM" && intentData.item) {
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

      const { error } = await supabase.from('items').insert({
        name: intentData.item,
        list_id: list.id,
        added_by: USER_ID,
        quantity: intentData.quantity || 1,
        unit: intentData.unit || null,
        price: intentData.price || null,
        category: intentData.category || null,
        notes: intentData.notes || null
      });
      if (error) throw error;
      return done(`Anotei ${intentData.item} na lista ${list.title}.`, list.id);
    }

    if (intentData.action === "CHECK_ITEM" && intentData.item) {
      const { match, ambiguous, listTitles } = await getTargetItem(false);
      if (ambiguous) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(listTitles)}. De qual você quer riscar?`);
      if (!match) return done(`Não achei ${intentData.item} pendente.`);
      await supabase.from('items').update({ is_purchased: true, checked_by: USER_ID, checked_at: new Date().toISOString() }).eq('id', match.id);
      return done(`Risquei ${match.name} da lista ${match.listTitle}.`, match.listId);
    }

    if (intentData.action === "UNCHECK_ITEM" && intentData.item) {
      const { match, ambiguous, listTitles } = await getTargetItem(true);
      if (ambiguous) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(listTitles)}. Qual quer desmarcar?`);
      if (!match) return done(`Não achei ${intentData.item} comprado para desmarcar.`);
      await supabase.from('items').update({ is_purchased: false, checked_by: null, checked_at: null }).eq('id', match.id);
      return done(`Voltei ${match.name} para pendente na lista ${match.listTitle}.`, match.listId);
    }

    if (intentData.action === "REMOVE_ITEM" && intentData.item) {
      const { match, ambiguous, listTitles } = await getTargetItem(null);
      if (ambiguous) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(listTitles)}. De qual quer excluir?`);
      if (!match) return done(`Não achei ${intentData.item} para excluir.`);
      await supabase.from('items').delete().eq('id', match.id);
      return done(`Tirei ${match.name} da lista ${match.listTitle}.`, match.listId);
    }

    if (intentData.action === "UPDATE_ITEM" && intentData.item) {
      if (intentData.targetListName && !moveList) return done(`Não achei a lista ${intentData.targetListName}.`);
      const { match, ambiguous, listTitles } = await getTargetItem(null);
      if (ambiguous) return askWhichList(`Achei ${intentData.item} nas listas ${joinPt(listTitles)}. De qual quer alterar?`);
      if (!match) return done(`Não achei ${intentData.item} para atualizar.`);

      const updatePayload: Record<string, unknown> = {};
      if (intentData.price !== null) updatePayload.price = intentData.price;
      if (intentData.quantity !== null) updatePayload.quantity = intentData.quantity;
      if (intentData.unit !== null) updatePayload.unit = intentData.unit;
      if (intentData.category !== null) updatePayload.category = intentData.category;
      if (intentData.newName !== null) updatePayload.name = intentData.newName;
      if (moveList) updatePayload.list_id = moveList.id;

      if (Object.keys(updatePayload).length === 0) return done(`Não entendi o que mudar em ${match.name}.`);
      await supabase.from('items').update(updatePayload).eq('id', match.id);
      return done(moveList ? `Movi ${match.name} para a lista ${moveList.title}.` : `Atualizei ${match.name}.`, moveList?.id || match.listId);
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
      const { data: listItems } = await q;

      const total = (listItems || []).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
      const scope = intentData.statusFilter === 'purchased' ? 'dos itens comprados ' : intentData.statusFilter === 'pending' ? 'do que falta ' : '';
      return done(`O total ${scope}da lista ${list.title} é ${formatBRL(total)}.`, list.id);
    }

    if (intentData.action === "LIST_ITEMS") {
      // Sem lista citada e sem filtro: lê os nomes das listas
      const list = namedList || (intentData.statusFilter || intentData.category ? defaultList : null);
      if (list) {
        let q = supabase.from('items').select('name').eq('list_id', list.id).order('position', { ascending: true });
        if (intentData.statusFilter === 'purchased') q = q.eq('is_purchased', true);
        if (intentData.statusFilter === 'pending') q = q.eq('is_purchased', false);
        if (intentData.category) q = q.ilike('category', `%${intentData.category}%`);

        const { data: listItems } = await q;
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
    return respondWithAlexa("Qual item?", false, attrs());

  } catch (error) {
    console.error("Erro Fatal no Agente Alexa:", error);
    return respondWithAlexa("Nossa, deu um curto circuito aqui na minha inteligência. Pode tentar de novo?", false);
  }
}

function respondWithAlexa(text: string, shouldEndSession = false, sessionAttributes = {}) {
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
