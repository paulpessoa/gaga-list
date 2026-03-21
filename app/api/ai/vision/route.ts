import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cleanBase64Image } from '@/lib/ai-utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || (profile.credits ?? 0) < 1) {
      return NextResponse.json({ error: 'Energia insuficiente. Você precisa de 1 grão para identificar produtos.' }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (OPENAI_API_KEY)' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    const finalImage = cleanBase64Image(image);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identifique este produto de supermercado. Retorne um JSON com: \"name\", \"brand\", \"category\", \"benefits\" (breve texto), \"suggested_uses\" (array de ideias). Retorne APENAS o JSON." },
            {
              type: "image_url",
              image_url: {
                url: finalImage,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Deduzir créditos e logar
    await supabase.from('profiles').update({ credits: (profile.credits ?? 0) - 1 }).eq('id', user.id);
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'vision',
      cost: 1,
      model_used: 'gpt-4o-mini'
    });

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Erro na visão AI:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar imagem com IA', details: error.message },
      { status: 500 }
    );
  }
}
