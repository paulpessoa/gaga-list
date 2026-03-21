import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
