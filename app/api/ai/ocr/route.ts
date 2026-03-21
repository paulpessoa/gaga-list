import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Configuração de IA ausente' }, { status: 500 });
    }

    const { image } = await request.json(); // Base64 image

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    // Usar Llama Vision para extrair texto de listas (OCR Inteligente)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em extração de dados (OCR). Sua tarefa é ler imagens de listas de compras (escritas à mão ou impressas) e transformar em dados estruturados. Retorne APENAS um JSON array de objetos com "name", "quantity" e "category". Se não entender algo, ignore. Exemplo: [{"name": "Arroz", "quantity": "5kg", "category": "Mercearia"}]',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extraia todos os itens de compra desta imagem.' },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      model: 'llama-3.2-11b-vision-preview',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const items = Array.isArray(result) ? result : result.items || [];

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Erro no OCR AI:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair lista da foto', details: error.message },
      { status: 500 }
    );
  }
}
