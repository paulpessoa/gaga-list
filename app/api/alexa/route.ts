import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // Node.js é recomendado para integrações complexas (ex: ask-sdk), mas Edge também funciona para fetch manual.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request, session } = body;

    // Log para depuração na Vercel
    console.log("Alexa Request:", JSON.stringify(body, null, 2));

    // Validar se é uma Intenção (Intent)
    if (request?.type === 'IntentRequest') {
      const intentName = request.intent.name;

      if (intentName === 'AddItemIntent') {
        const item = request.intent.slots?.Item?.value;
        const listName = request.intent.slots?.List?.value;

        if (!item || !listName) {
          return respondWithAlexa("Desculpe, não entendi o item ou a lista. Pode repetir?");
        }

        // TODO: Account Linking
        // 1. Pegar token do usuário a partir de session.user.accessToken
        // 2. Usar o token para inicializar um Supabase client autenticado (RLS)
        // const token = session?.user?.accessToken;
        
        // --- Exemplo de Interação com o Supabase ---
        // OBS: Usando supabaseServerClient temporariamente (Service Role)
        // O ideal é buscar a lista pelo nome e associar ao item.
        // await supabaseServerClient.from('items').insert({ name: item, list_id: ... });

        return respondWithAlexa(`Adicionei ${item} na sua lista de ${listName}.`, true);
      }
    }

    // Se a intenção for de Launch (quando o usuário diz apenas "Alexa, abrir Gaga List")
    if (request?.type === 'LaunchRequest') {
      return respondWithAlexa("Bem-vindo ao Gaga List! O que você deseja adicionar?");
    }

    // Fallback caso não entenda
    return respondWithAlexa("Desculpe, não entendi o que você quis fazer na sua lista.");
  } catch (error) {
    console.error("Erro na rota da Alexa:", error);
    return respondWithAlexa("Ocorreu um erro ao processar o seu pedido no Gaga List.", true);
  }
}

// Função auxiliar para formatar a resposta da Alexa
function respondWithAlexa(text: string, shouldEndSession = false) {
  return NextResponse.json({
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: text
      },
      shouldEndSession
    }
  });
}
