import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Erro de config' }, { status: 500 });

    const groq = new Groq({ apiKey });
    const { items, type } = await request.json();

    const prompt = type === 'from_list' 
      ? `Com base nestes itens de compra: ${items.join(', ')}. Sugira 3 receitas criativas. Retorne um JSON array de objetos com: "title", "description", "difficulty", "prep_time", "ingredients" (array de {name, quantity}) e "instructions" (array de strings).`
      : `Sugira uma receita de "${items}". Retorne o mesmo formato JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const recipes = Array.isArray(result) ? result : (result.recipes || []);

    return NextResponse.json({ recipes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
