import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GROQ_API_KEY)' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });
    const { items, type } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum ingrediente fornecido' }, { status: 400 });
    }

    const prompt = type === 'from_list' 
      ? `Você é um Chef Gourmet. Baseado nesta lista de compras: ${items.join(', ')}, sugira 3 receitas criativas e práticas. Priorize o aproveitamento total dos ingredientes.`
      : `Você é um Chef Gourmet. Sugira uma receita detalhada para: "${items[0]}".`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Você é um Chef de Cozinha renomado e especialista em gastronomia prática. 
          Sua tarefa é gerar receitas deliciosas em formato JSON.
          REGRAS:
          1. Retorne SEMPRE um objeto JSON com a chave "recipes" contendo um array de objetos.
          2. Cada objeto de receita deve ter: "title", "description", "prep_time", "difficulty", "ingredients" (array de {name, quantity}), "instructions" (array de strings).
          3. Use "Fácil", "Médio" ou "Difícil" para a dificuldade.
          4. O tom deve ser inspirador e profissional.
          5. Certifique-se de que os ingredientes sejam realistas e as instruções claras.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"recipes": []}');
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro ao gerar receitas com IA:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões culinárias', details: error.message },
      { status: 500 }
    );
  }
}
