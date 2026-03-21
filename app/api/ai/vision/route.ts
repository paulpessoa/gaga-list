import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cleanBase64Image } from '@/lib/ai-utils';

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Erro na visão AI:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar imagem com IA', details: error.message },
      { status: 500 }
    );
  }
}
