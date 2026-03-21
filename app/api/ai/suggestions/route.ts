import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any).from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: 'Energia insuficiente.' }, { status: 403 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Erro de config' }, { status: 500 });

    const groq = new Groq({ apiKey });
    const { productName, brand, category } = await request.json();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um chef e nutricionista. Com base em um produto, retorne um JSON com "benefits" (texto curto sobre saúde/uso) e "suggested_uses" (array de 3 a 5 ideias de uso ou receitas).',
        },
        {
          role: 'user',
          content: `Produto: ${productName}, Marca: ${brand}, Categoria: ${category}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    // Deduzir créditos e logar
    await (supabase as any).from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    await (supabase as any).from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'suggestion',
      cost: 1,
      model_used: 'llama-3.3'
    });

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
