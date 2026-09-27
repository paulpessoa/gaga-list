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
  action: z.enum(["ADD_ITEM", "LIST_ITEMS", "REMOVE_ITEM", "CHECK_ITEM", "UNKNOWN"]),
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
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini", // Baixa latência é obrigatória para a Alexa (máx 8s)
    messages: [
      {
        role: "system",
        content: `Você é o agente inteligente do Gaga List. Seu objetivo é extrair a real intenção da frase do usuário.
        Regras:
        - Seja extremamente carismático, natural e breve na sua 'naturalResponse'. 
        - Não seja robótico.
        - Se a ação for desconhecida (UNKNOWN), na naturalResponse pergunte o que o usuário deseja fazer.`
      },
      { role: "user", content: rawText }
    ],
    response_format: zodResponseFormat(AlexaIntentSchema, "alexa_intent"),
  });

  return completion.choices[0].message.parsed as ParsedAlexaIntent;
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

    // 3. Acionar o Agente (LLM)
    console.log("Acionando Agente para:", rawText);
    const intentData = await processUserUtterance(rawText);
    console.log("Agente Respondeu:", intentData);

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
      let query = supabase.from('items').update({ is_purchased: true }).ilike('name', `%${intentData.item}%`).eq('is_purchased', false);
      if (targetListId) query = query.eq('list_id', targetListId);
      
      const { data: updated } = await query.select();
      if (!updated || updated.length === 0) {
        return respondWithAlexa(`Não achei o item ${intentData.item} pendente. Algo mais?`, false);
      }
    }

    else if (intentData.action === "LIST_ITEMS") {
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

function respondWithAlexa(text: string, shouldEndSession = false) {
  return NextResponse.json({
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession
    }
  });
}
