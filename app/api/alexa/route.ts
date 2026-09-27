import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

        // 1. Validar se o usuário vinculou a conta
        const accessToken = session?.user?.accessToken;
        if (!accessToken) {
          return respondWithAlexa(
            "Você precisa vincular sua conta do Gaga List no aplicativo da Alexa primeiro.", 
            true
          );
        }
        
        // 2. Inicializar o cliente do Supabase passando o Token do usuário
        // Isso ativa o RLS! O código agora rodará com as permissões restritas do dono da conta.
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
        );

        // Pega o usuário logado para usarmos o ID dele nas inserções
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return respondWithAlexa("Ocorreu um erro de autenticação com a sua conta.", true);
        }
        
        const USER_ID = user.id;
        
        // 3. Buscar se a lista já existe para esse usuário
        let { data: listData, error: listError } = await supabase
          .from('lists')
          .select('id')
          .eq('owner_id', USER_ID)
          .ilike('title', listName)
          .single();

        let listId = listData?.id;

        // 4. Se não existir, cria a lista na hora!
        if (!listId) {
          const { data: newList, error: createListError } = await supabase
            .from('lists')
            .insert({
              title: listName,
              owner_id: USER_ID
            })
            .select('id')
            .single();
            
          if (createListError) throw createListError;
          listId = newList.id;
        }

        // 5. Insere o item na tabela
        const { error: itemError } = await supabase
          .from('items')
          .insert({
            name: item,
            list_id: listId,
            added_by: USER_ID,
            quantity: 1,
            is_purchased: false
          });

        if (itemError) throw itemError;

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
