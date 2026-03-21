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
      return NextResponse.json({ error: 'Energia insuficiente. Você precisa de 1 grão para usar a voz.' }, { status: 403 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração de IA ausente (GROQ_API_KEY)' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

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

    // 2. Extrair itens usando Llama no GROQ
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de compras. Sua tarefa é extrair itens de uma lista de compras a partir de um texto. Retorne apenas um JSON array de objetos com as chaves "name", "quantity" (string com unidade se houver) e "category". Se não houver categoria clara, use null. Exemplo: [{"name": "Leite", "quantity": "2 caixas", "category": "Laticínios"}]',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const items = Array.isArray(result) ? result : result.items || [];

    // Deduzir créditos e logar
    await (supabase as any).from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    await (supabase as any).from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'voice',
      cost: 1,
      model_used: 'whisper-large-v3 + llama-3.3'
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
