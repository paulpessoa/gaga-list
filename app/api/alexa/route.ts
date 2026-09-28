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
  action: z.enum(["ADD_ITEM", "LIST_ITEMS", "REMOVE_ITEM", "CHECK_ITEM", "END_SESSION", "UNKNOWN"]),
  item: z.string().nullable().describe("O nome do item mencionado (ex: café, carvão)"),
  listName: z.string().nullable().describe("O nome da lista. Se não for especificada, retorne null."),
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
        content: `Você é o agente inteligente do aplicativo Gaga List. Extraia a intenção do usuário.
Regras de Classificação OBRIGATÓRIAS:
- ADD_ITEM: Somente quando o usuário quiser INSERIR, ANOTAR, COLOCAR, COMPRAR algo novo na lista.
- CHECK_ITEM: Quando o usuário disser que JÁ COMPROU, PEGOU, MARCAR COMO COMPRADO ou RISCAR da lista.
- REMOVE_ITEM: Quando o usuário quiser APAGAR, EXCLUIR, TIRAR, REMOVER da lista (desistir do item).
- LIST_ITEMS: Quando o usuário perguntar QUAIS LISTAS ele tem ou QUANTAS listas.
- END_SESSION: Quando o usuário disser "só isso", "nada", "tchau", "encerrar", "pronto".
- UNKNOWN: Apenas se não tiver nada a ver com listas.

Gere uma 'naturalResponse' carismática e ultra-breve confirmando o que foi feito. Nunca diga "Posso ajudar em mais algo?" se for END_SESSION.`
      },
      { role: "user", content: rawText }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "alexa_intent",
        strict: true,
        schema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["ADD_ITEM", "LIST_ITEMS", "REMOVE_ITEM", "CHECK_ITEM", "END_SESSION", "UNKNOWN"] },
            item: { type: ["string", "null"] },
            listName: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
            naturalResponse: { type: "string" }
          },
          required: ["action", "item", "listName", "notes", "naturalResponse"],
          additionalProperties: false
        }
      }
    },
  });

  return JSON.parse(completion.choices[0].message.content!) as ParsedAlexaIntent;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request, session } = body;

    console.log("Alexa Request:", JSON.stringify(body, null, 2));

    // Fluxo de Interrupção Padrão (Amazon)
    if (request?.type === 'IntentRequest') {
      const intentName = request.intent.name;
      if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.NoIntent') {
        return respondWithAlexa("Até a próxima!", true);
      }
    }

    // 1. Validar Account Linking no início
    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      return respondWithAlexa("Você precisa vincular sua conta do Gaga List no aplicativo da Alexa primeiro.", true);
    }

    // Handle SessionEndedRequest (quando a Alexa fecha a sessão por inatividade ou usuário manda sair)
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

    // Se for Launch Request ("Alexa, abrir Gaga List")
    if (request?.type === 'LaunchRequest') {
      return respondWithAlexa("Opa, Gaga List na escuta! O que você precisa anotar?", false);
    }

    // 2. Extrair o Texto Bruto (Aqui assumimos que a Alexa vai mandar o slot {Query})
    // No seu Alexa Console, você deve criar um "AgentIntent" com um slot chamado "Query" usando o tipo "AMAZON.SearchQuery".
    let rawText = "";
    if (request?.type === 'IntentRequest') {
      // Pega o texto de um slot catch-all, se existir
      rawText = request.intent.slots?.Query?.value || "";
    }

    if (!rawText) {
      return respondWithAlexa("Desculpe, não ouvi direito. O que você quer fazer?", false);
    }

    const sessionAttributes = session?.attributes || {};
    let promptText = rawText;

    // Injeta o contexto da conversa anterior se o usuário estiver respondendo a uma desambiguação
    if (sessionAttributes.pendingAction && sessionAttributes.pendingItem) {
      promptText = `[Contexto da conversa anterior: O usuário estava tentando executar a ação ${sessionAttributes.pendingAction} para o item "${sessionAttributes.pendingItem}". Ele agora está respondendo de qual lista ele quer realizar a ação.] Frase atual do usuário: "${rawText}"`;
    }

    // 3. Acionar o Agente (LLM)
    console.log("Acionando Agente para:", promptText);
    const intentData = await processUserUtterance(promptText);
    console.log("Agente Respondeu:", intentData);

    if (intentData.action === "END_SESSION") {
      return respondWithAlexa(intentData.naturalResponse, true);
    }

    if (intentData.action === "UNKNOWN") {
      return respondWithAlexa(intentData.naturalResponse, false);
    }

    // 4. Executar Lógica de Negócio com os Dados Estruturados
    let targetListId = null;

    // Resolve a lista
    if (intentData.listName) {
      const { data: listData } = await supabase
        .from('lists')
        .select('id')
        .eq('owner_id', USER_ID)
        .ilike('title', intentData.listName)
        .single();
        
      if (listData) {
        targetListId = listData.id;
      } else if (intentData.action === "ADD_ITEM") {
        // Cria a lista automaticamente se for inserção
        const { data: newList } = await supabase
          .from('lists')
          .insert({ title: intentData.listName, owner_id: USER_ID })
          .select('id').single();
        targetListId = newList?.id;
      }
    }

    // Handlers Específicos
    if (intentData.action === "ADD_ITEM" && intentData.item) {
      const { error } = await supabase.from('items').insert({
        name: intentData.item,
        list_id: targetListId, // Se for null, vai ficar órfão, idealmente ter uma lista Padrão.
        added_by: USER_ID,
        quantity: 1,
        notes: intentData.notes || null
      });
      if (error) throw error;
    } 
    
    else if (intentData.action === "CHECK_ITEM" && intentData.item) {
      // 1. Primeiro busca quantos itens existem com esse nome (que não estão comprados)
      let query = supabase.from('items').select('id, list_id, lists(title)').ilike('name', `%${intentData.item}%`).eq('is_purchased', false);
      if (targetListId) query = query.eq('list_id', targetListId);
      
      const { data: foundItems, error: searchError } = await query;
      if (searchError) throw searchError;
      
      if (!foundItems || foundItems.length === 0) {
        return respondWithAlexa(`Não achei nenhum item parecido com ${intentData.item} pendente. Algo mais?`, false);
      }

      // 2. Desambiguação: Se achou em mais de uma lista e o usuário não especificou a lista
      if (foundItems.length > 1) {
        const listNames = foundItems.map((i: any) => i.lists?.title || 'Sem Nome').join(' e ');
        return respondWithAlexa(
          `Achei ${intentData.item} em mais de uma lista: ${listNames}. De qual lista você quer riscar?`, 
          false,
          { pendingAction: intentData.action, pendingItem: intentData.item }
        );
      }

      // 3. Se achou apenas 1, atualiza
      const { error: updateError } = await supabase.from('items').update({ is_purchased: true }).eq('id', foundItems[0].id);
      if (updateError) throw updateError;
    }
    
    else if (intentData.action === "REMOVE_ITEM" && intentData.item) {
      let query = supabase.from('items').select('id, list_id, lists(title)').ilike('name', `%${intentData.item}%`);
      if (targetListId) query = query.eq('list_id', targetListId);
      
      const { data: foundItems, error: searchError } = await query;
      if (searchError) throw searchError;
      
      if (!foundItems || foundItems.length === 0) {
        return respondWithAlexa(`Não achei o item ${intentData.item} para excluir. Algo mais?`, false);
      }

      if (foundItems.length > 1) {
        const listNames = foundItems.map((i: any) => i.lists?.title || 'Sem Nome').join(' e ');
        return respondWithAlexa(
          `Achei ${intentData.item} em mais de uma lista: ${listNames}. De qual delas você quer excluir?`, 
          false,
          { pendingAction: intentData.action, pendingItem: intentData.item }
        );
      }

      const { error: deleteError } = await supabase.from('items').delete().eq('id', foundItems[0].id);
      if (deleteError) throw deleteError;
    }

    else if (intentData.action === "LIST_ITEMS") {
      // Se especificou uma lista, lê os itens dessa lista
      if (targetListId && intentData.listName) {
        const { data: listItems } = await supabase.from('items').select('name').eq('list_id', targetListId).eq('is_purchased', false);
        if (listItems && listItems.length > 0) {
          const itemNames = listItems.map(i => i.name).join(', ');
          return respondWithAlexa(`Na lista ${intentData.listName} você tem: ${itemNames}. Algo mais?`, false);
        } else {
          return respondWithAlexa(`A lista ${intentData.listName} está vazia ou tudo já foi comprado. Algo mais?`, false);
        }
      }

      // Se não especificou lista, lê os nomes das listas
      const { data: lists } = await supabase.from('lists').select('title').eq('owner_id', USER_ID).is('deleted_at', null);
      if (lists && lists.length > 0) {
        const titles = lists.map(l => l.title);
        const formatTitle = titles.length > 1 ? titles.slice(0, -1).join(', ') + ' e ' + titles[titles.length - 1] : titles[0];
        return respondWithAlexa(`Você tem ${lists.length} listas. Elas são: ${formatTitle}. Algo mais?`, false);
      } else {
        return respondWithAlexa("Você não tem nenhuma lista cadastrada. Algo mais?", false);
      }
    }

    // 5. Retornar a fala mágica criada pelo LLM
    return respondWithAlexa(intentData.naturalResponse + " Algo mais?", false);

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
