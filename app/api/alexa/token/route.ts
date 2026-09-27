import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Endpoint Proxy para o OAuth2 da Alexa
export async function POST(req: Request) {
  try {
    // Alexa envia os dados no formato x-www-form-urlencoded
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);
    
    const grantType = params.get('grant_type');
    const clientId = params.get('client_id'); // Podemos validar se é o ID da nossa Skill
    
    // Inicializamos um cliente Supabase "zerado" para fazer a troca de tokens
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let refreshTokenToUse: string | null = null;

    if (grantType === 'authorization_code') {
      // No nosso hack genial, o "code" que enviamos para a Alexa na verdade
      // é o Refresh Token encriptado (ou em base64) gerado na página de Link.
      const code = params.get('code');
      if (code) {
        refreshTokenToUse = Buffer.from(code, 'base64').toString('utf-8');
      }
    } else if (grantType === 'refresh_token') {
      // Fluxo de renovação quando o token de 1 hora da Alexa expira
      refreshTokenToUse = params.get('refresh_token');
    }

    if (!refreshTokenToUse) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Pedimos para o Supabase trocar o Refresh Token por um novo Access Token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshTokenToUse,
    });

    if (error || !data.session) {
      console.error('Erro ao renovar sessão no proxy:', error);
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Retornamos exatamente no formato OAuth2 padrão que a Amazon Alexa exige
    return NextResponse.json({
      access_token: data.session.access_token,
      token_type: 'bearer',
      expires_in: data.session.expires_in,
      refresh_token: data.session.refresh_token,
    });

  } catch (err) {
    console.error('Erro fatal no token proxy:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
