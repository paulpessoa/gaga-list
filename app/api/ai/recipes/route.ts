import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/lib/supabase/server';

/**
 * Gera receitas gourmet utilizando a IA do Gemini com base em uma lista de ingredientes ou um item específico.
 * 
 * PORQUÊ: Esta implementação centraliza a lógica de geração de conteúdo culinário no servidor para proteger
 * a API Key e gerenciar o sistema de créditos (Grãos) de forma segura, garantindo que apenas usuários
 * autenticados com saldo positivo possam utilizar o serviço.
 * 
 * @param {Request} request - O objeto da requisição contendo os itens e o tipo de geração.
 * @returns {Promise<NextResponse>} - Resposta JSON com as receitas geradas ou erro.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Verificar Créditos (Grãos)
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || (profile.credits ?? 0) < 1) {
      return NextResponse.json({ error: 'Energia insuficiente. Recarregue seus grãos.' }, { status: 403 });
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GOOGLE_AI_STUDIO_API_KEY)' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const { items, type } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum ingrediente fornecido' }, { status: 400 });
    }

    const prompt = type === 'from_list' 
      ? `Você é um Chef Gourmet. Baseado nesta lista de compras: ${items.join(', ')}, sugira 3 receitas criativas e práticas. Priorize o aproveitamento total dos ingredientes.
         REGRA DE SEGURANÇA: Se a lista contiver majoritariamente itens não comestíveis (ex: eletrônicos, ferramentas, limpeza) que não podem compor uma receita, NÃO gere receitas. Em vez disso, explique o motivo.
         Retorne um JSON com a chave "recipes" contendo um array de objetos. 
         Cada objeto deve ter: "title", "description", "prep_time", "difficulty", "ingredients" (array de {name, quantity}), "instructions" (array de strings).`
      : `Você é um Chef Gourmet. Sugira uma receita detalhada para: "${items[0]}".
         REGRA DE SEGURANÇA: Se o item "${items[0]}" não for algo comestível ou um ingrediente culinário, NÃO gere a receita.
         Retorne un JSON com a chave "recipes" contendo um array com essa única receita.
         Cada objeto deve ter: "title", "description", "prep_time", "difficulty", "ingredients" (array de {name, quantity}), "instructions" (array de strings).`;

    console.log('Gerando conteúdo com Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Resposta bruta Gemini:', text);
    
    // Limpar markdown se a IA retornar
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    if (parsedData.error || (!parsedData.recipes && !parsedData.title)) {
       // Se a IA retornar erro de segurança ou não gerar receitas
       return NextResponse.json({ 
         error: parsedData.error || "A IA identificou itens não comestíveis. Por favor, use ingredientes culinários.",
         recipes: [] 
       }, { status: 200 }); // Status 200 para o front tratar a mensagem
    }

    // 2. Deduzir crédito e logar
    await supabase.from('profiles').update({ credits: (profile.credits ?? 0) - 1 }).eq('id', user.id);
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'recipe',
      cost: 1,
      model_used: 'gemini-flash-latest'
    });

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erro ao gerar receitas com Gemini:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões culinárias com Gemini', details: error.message },
      { status: 500 }
    );
  }
}
