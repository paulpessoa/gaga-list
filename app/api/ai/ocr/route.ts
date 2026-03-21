import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cleanBase64Image } from '@/lib/ai-utils';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente' }, { status: 500 });
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
          role: "system",
          content: "Você é um especialista em extração de dados (OCR). Sua tarefa é ler imagens de listas de compras (escritas à mão ou impressas) e transformar em dados estruturados. Retorne apenas um JSON array de objetos com as chaves \"name\", \"quantity\" e \"category\". Retorne apenas o array principal.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia todos os itens de compra desta imagem." },
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

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);
    const items = Array.isArray(result) ? result : (result.items || result.list || []);

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Erro no OCR AI:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair lista da foto', details: error.message },
      { status: 500 }
    );
  }
}
