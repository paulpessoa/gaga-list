import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GROQ_API_KEY)' }, { status: 500 });
    }

    const { image } = await request.json(); // Base64 image

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    // Identificar produto usando Llama Vision no GROQ
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identifique este produto de supermercado. Retorne um JSON com: "name", "brand", "category", "benefits" (breve texto), "suggested_uses" (array de ideias). Retorne APENAS o JSON.' },
            {
              type: 'image_url',
              image_url: {
                url: image, // Base64 data:image/jpeg;base64,...
              },
            },
          ],
        },
      ],
      model: 'llama-3.2-11b-vision-preview',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Erro na visão AI:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar imagem com IA', details: error.message },
      { status: 500 }
    );
  }
}
