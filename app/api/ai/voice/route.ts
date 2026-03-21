import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      return NextResponse.json({ error: 'Energia insuficiente. Você precisa de 1 grão para usar a voz.' }, { status: 403 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;

    if (!groqKey || !geminiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GROQ ou Gemini)' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });
    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio enviado' }, { status: 400 });
    }

    // 1. Transcrever áudio usando Whisper no GROQ
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
      language: 'pt',
      response_format: 'text',
    });

    const text = typeof transcription === 'string' ? transcription : (transcription as any).text;

    // 2. Extrair itens usando Gemini
    const prompt = `Você é um assistente de compras inteligente. 
    Extraia os itens de compra do seguinte texto transcrito de áudio: "${text}"
    Retorne APENAS um JSON com a chave "items" contendo um array de objetos. 
    Cada objeto deve ter: "name" (string), "quantity" (string ou null) e "category" (string ou null).
    Exemplo: {"items": [{"name": "Leite", "quantity": "2 caixas", "category": "Laticínios"}]}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    // Parsing robusto
    let items = [];
    try {
      const jsonText = rawText.replace(/```json|```/g, '').trim();
      const parsedResult = JSON.parse(jsonText);
      items = Array.isArray(parsedResult) ? parsedResult : (parsedResult.items || []);
    } catch (e) {
      console.warn('Falha ao parsear JSON da IA, tentando extração manual...');
      // Fallback simples se o JSON falhar
      items = [];
    }

    // Deduzir créditos e logar
    await (supabase as any).from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    await (supabase as any).from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'voice',
      cost: 1,
      model_used: 'whisper-large-v3 + gemini-flash-latest'
    });

    return NextResponse.json({ 
      transcription: text,
      items: items 
    });

  } catch (error: any) {
    console.error('Erro no processamento de voz AI:', error);
    return NextResponse.json(
      { error: 'Erro ao processar voz com IA', details: error.message },
      { status: 500 }
    );
  }
}
