import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const runtime = 'nodejs';

// Configuração do Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

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
  naturalResponse: z.string().describe("O que a Alexa deve falar de volta para o usuário com carisma e naturalidade."),
});

type ParsedAlexaIntent = z.infer<typeof AlexaIntentSchema>;

/**
 * Função Core do Agente: Processa o texto livre e retorna a intenção estruturada.
 */
async function processUserUtterance(rawText: string): Promise<ParsedAlexaIntent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Baixa latência é obrigatória para a Alexa (máx 8s)
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

Gere uma 'naturalResponse' carismática e ultra-breve confirmando o que foi feito. Se a ação pedir desambiguação, pergunte de forma natural. Nunca diga "Posso ajudar em mais algo?" se for END_SESSION.`
      },
      { role: "user", content: rawText }
    ],
    response_format: zodResponseFormat(AlexaIntentSchema, "alexa_intent"),
  });

  return JSON.parse(completion.choices[0].message.content!) as ParsedAlexaIntent;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request, session } = body;

    console.log("Alexa Request:", JSON.stringify(body, null, 2));

    if (request?.type === 'IntentRequest') {
      const intentName = request.intent.name;
      if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.NoIntent') {
        return respondWithAlexa("Até a próxima!", true);
      }
    }

    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      return respondWithAlexa("Você precisa vincular sua conta do Gaga List no aplicativo da Alexa primeiro.", true);
    }

    if (request?.type === 'SessionEndedRequest') {
      console.log('Sessão encerrada pela Alexa:', request.reason);
      return NextResponse.json({ version: "1.0", response: { shouldEndSession: true } });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return respondWithAlexa("Ocorreu um erro de autenticação.", true);
    const USER_ID = user.id;

    if (request?.type === 'LaunchRequest') {
      return respondWithAlexa("Opa, Gaga List na escuta! O que você precisa anotar?", false);
    }

    let rawText = "";
    if (request?.type === 'IntentRequest') {
      rawText = request.intent.slots?.Query?.value || "";
    }

    if (!rawText) {
      return respondWithAlexa("Desculpe, não ouvi direito. O que você quer fazer?", false);
    }

    const sessionAttributes = session?.attributes || {};
    let promptText = rawText;

    if (sessionAttributes.pendingAction && sessionAttributes.pendingItem) {
      promptText = `[Contexto da conversa anterior: O usuário tentava a ação ${sessionAttributes.pendingAction} no item "${sessionAttributes.pendingItem}". Ele responde à pergunta de qual lista usar.] Resposta do usuário: "${rawText}"`;
    }

    console.log("Acionando Agente para:", promptText);
    const intentData = await processUserUtterance(promptText);
    console.log("Agente Respondeu:", intentData);

    // Save previous state for basic UNDO
    const nextSessionAttributes = {
      lastAction: intentData.action,
      lastItem: intentData.item,
      lastList: intentData.listName
    };

    if (intentData.action === "END_SESSION") {
      return respondWithAlexa(intentData.naturalResponse, true);
    }

    if (intentData.action === "UNKNOWN") {
      return respondWithAlexa(intentData.naturalResponse, false, nextSessionAttributes);
    }

    if (intentData.action === "UNDO_ACTION") {
      return respondWithAlexa("Eu ainda estou aprendendo a desfazer ações automáticas, mas você pode me pedir diretamente para reverter o que foi feito, como 'desmarcar o item' ou 'apagar o item'!", false, nextSessionAttributes);
    }

    let targetListId: string | null = null;
    if (intentData.listName) {
      const { data: listData } = await supabase.from('lists').select('id').eq('owner_id', USER_ID).ilike('title', intentData.listName).single();
      if (listData) {
        targetListId = listData.id;
      } else if (intentData.action === "ADD_ITEM") {
        const { data: newList } = await supabase.from('lists').insert({ title: intentData.listName, owner_id: USER_ID }).select('id').single();
        targetListId = newList?.id;
      }
    }

    let targetMoveListId: string | null = null;
    if (intentData.targetListName) {
      const { data: mList } = await supabase.from('lists').select('id').eq('owner_id', USER_ID).ilike('title', intentData.targetListName).single();
      if (mList) targetMoveListId = mList.id;
    }

    // Helper desambiguação
    async function getTargetItem(statusFilter: boolean | null = null) {
      if (!intentData.item) return { items: null, listNames: "" };
      let query = supabase.from('items').select('id, list_id, lists(title)').ilike('name', `%${intentData.item}%`);
      if (targetListId) query = query.eq('list_id', targetListId);
      if (statusFilter !== null) query = query.eq('is_purchased', statusFilter);
      
      const { data: foundItems } = await query;
      let listNames = "";
      if (foundItems && foundItems.length > 1) {
        listNames = foundItems.map((i: any) => i.lists?.title || 'Sem Nome').join(' e ');
      }
      return { items: foundItems, listNames };
    }

    // Handlers
    if (intentData.action === "ADD_ITEM" && intentData.item) {
      const { error } = await supabase.from('items').insert({
        name: intentData.item,
        list_id: targetListId,
        added_by: USER_ID,
        quantity: intentData.quantity || 1,
        unit: intentData.unit || null,
        price: intentData.price || null,
        category: intentData.category || null,
        notes: intentData.notes || null
      });
      if (error) throw error;
    } 
    
    else if (intentData.action === "CHECK_ITEM" && intentData.item) {
      const { items, listNames } = await getTargetItem(false);
      if (!items || items.length === 0) return respondWithAlexa(`Não achei ${intentData.item} pendente. Algo mais?`, false, nextSessionAttributes);
      if (items.length > 1) return respondWithAlexa(`Achei ${intentData.item} nas listas: ${listNames}. De qual lista você quer riscar?`, false, { pendingAction: intentData.action, pendingItem: intentData.item });
      await supabase.from('items').update({ is_purchased: true }).eq('id', items[0].id);
    }

    else if (intentData.action === "UNCHECK_ITEM" && intentData.item) {
      const { items, listNames } = await getTargetItem(true);
      if (!items || items.length === 0) return respondWithAlexa(`Não achei ${intentData.item} comprado para desmarcar. Algo mais?`, false, nextSessionAttributes);
      if (items.length > 1) return respondWithAlexa(`Achei ${intentData.item} em várias listas: ${listNames}. Qual quer desmarcar?`, false, { pendingAction: intentData.action, pendingItem: intentData.item });
      await supabase.from('items').update({ is_purchased: false }).eq('id', items[0].id);
    }
    
    else if (intentData.action === "REMOVE_ITEM" && intentData.item) {
      const { items, listNames } = await getTargetItem(null);
      if (!items || items.length === 0) return respondWithAlexa(`Não achei ${intentData.item} para excluir. Algo mais?`, false, nextSessionAttributes);
      if (items.length > 1) return respondWithAlexa(`Achei ${intentData.item} em várias listas: ${listNames}. De qual quer excluir?`, false, { pendingAction: intentData.action, pendingItem: intentData.item });
      await supabase.from('items').delete().eq('id', items[0].id);
    }

    else if (intentData.action === "UPDATE_ITEM" && intentData.item) {
      const { items, listNames } = await getTargetItem(null);
      if (!items || items.length === 0) return respondWithAlexa(`Não achei ${intentData.item} para atualizar. Algo mais?`, false, nextSessionAttributes);
      if (items.length > 1) return respondWithAlexa(`Achei ${intentData.item} nas listas: ${listNames}. De qual quer alterar?`, false, { pendingAction: intentData.action, pendingItem: intentData.item });
      
      const updatePayload: any = {};
      if (intentData.price !== null) updatePayload.price = intentData.price;
      if (intentData.quantity !== null) updatePayload.quantity = intentData.quantity;
      if (intentData.unit !== null) updatePayload.unit = intentData.unit;
      if (intentData.category !== null) updatePayload.category = intentData.category;
      if (intentData.newName !== null) updatePayload.name = intentData.newName;
      if (targetMoveListId !== null) updatePayload.list_id = targetMoveListId;
      
      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('items').update(updatePayload).eq('id', items[0].id);
      }
    }

    else if (intentData.action === "SEARCH_ITEM" && intentData.item) {
      const { items, listNames } = await getTargetItem(null);
      if (!items || items.length === 0) return respondWithAlexa(`Não achei ${intentData.item} em nenhuma lista. Algo mais?`, false, nextSessionAttributes);
      return respondWithAlexa(`Sim! Encontrei ${intentData.item} na(s) lista(s): ${listNames}. Algo mais?`, false, nextSessionAttributes);
    }

    else if (intentData.action === "CALCULATE_TOTAL" && targetListId) {
      let q = supabase.from('items').select('price, quantity').eq('list_id', targetListId);
      if (intentData.statusFilter === 'purchased') q = q.eq('is_purchased', true);
      if (intentData.statusFilter === 'pending') q = q.eq('is_purchased', false);
      const { data: listItems } = await q;
      
      let total = 0;
      listItems?.forEach(i => { total += (i.price || 0) * (i.quantity || 1); });
      return respondWithAlexa(`O somatório ${intentData.statusFilter === 'purchased' ? 'dos itens comprados ' : ''}da lista ${intentData.listName} é de ${total.toFixed(2)} reais. Algo mais?`, false, nextSessionAttributes);
    }

    else if (intentData.action === "LIST_ITEMS") {
      if (targetListId) {
        let q = supabase.from('items').select('name').eq('list_id', targetListId);
        if (intentData.statusFilter === 'purchased') q = q.eq('is_purchased', true);
        if (intentData.statusFilter === 'pending') q = q.eq('is_purchased', false);
        if (intentData.category) q = q.ilike('category', `%${intentData.category}%`);
        
        const { data: listItems } = await q;
        if (listItems && listItems.length > 0) {
          const itemNames = listItems.map(i => i.name).join(', ');
          return respondWithAlexa(`Na lista ${intentData.listName} você tem: ${itemNames}. Algo mais?`, false, nextSessionAttributes);
        } else {
          return respondWithAlexa(`Não encontrei itens com esse critério na lista ${intentData.listName}. Algo mais?`, false, nextSessionAttributes);
        }
      }

      const { data: lists } = await supabase.from('lists').select('title').eq('owner_id', USER_ID).is('deleted_at', null);
      if (lists && lists.length > 0) {
        const titles = lists.map(l => l.title);
        const formatTitle = titles.length > 1 ? titles.slice(0, -1).join(', ') + ' e ' + titles[titles.length - 1] : titles[0];
        return respondWithAlexa(`Você tem ${lists.length} listas. Elas são: ${formatTitle}. Algo mais?`, false, nextSessionAttributes);
      } else {
        return respondWithAlexa("Você não tem nenhuma lista cadastrada. Algo mais?", false, nextSessionAttributes);
      }
    }

    return respondWithAlexa(intentData.naturalResponse + " Algo mais?", false, nextSessionAttributes);

  } catch (error) {
    console.error("Erro Fatal no Agente Alexa:", error);
    return respondWithAlexa("Nossa, deu um curto circuito aqui na minha inteligência. Pode tentar de novo?", false);
  }
}

function respondWithAlexa(text: string, shouldEndSession = false, sessionAttributes = {}) {
  return NextResponse.json({
    version: "1.0",
    sessionAttributes,
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession
    }
  });
}
