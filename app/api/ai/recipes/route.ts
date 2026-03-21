import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Verificar Créditos (Grãos)
    const { data: profile } = await (supabase as any).from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: 'Energia insuficiente. Recarregue seus grãos.' }, { status: 403 });
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GOOGLE_AI_STUDIO_API_KEY)' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const { items, type } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum ingrediente fornecido' }, { status: 400 });
    }

    const prompt = type === 'from_list' 
      ? `Você é um Chef Gourmet. Baseado nesta lista de compras: ${items.join(', ')}, sugira 3 receitas criativas e práticas. Priorize o aproveitamento total dos ingredientes.
         Retorne um JSON com a chave "recipes" contendo um array de objetos. 
         Cada objeto deve ter: "title", "description", "prep_time", "difficulty", "ingredients" (array de {name, quantity}), "instructions" (array de strings).`
      : `Você é um Chef Gourmet. Sugira uma receita detalhada para: "${items[0]}".
         Retorne um JSON com a chave "recipes" contendo um array com essa única receita.
         Cada objeto deve ter: "title", "description", "prep_time", "difficulty", "ingredients" (array de {name, quantity}), "instructions" (array de strings).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // 2. Deduzir crédito e logar
    await (supabase as any).from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    await (supabase as any).from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'recipe',
      cost: 1,
      model_used: 'gemini-1.5-flash'
    });

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error('Erro ao gerar receitas com Gemini:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões culinárias com Gemini', details: error.message },
      { status: 500 }
    );
  }
}
