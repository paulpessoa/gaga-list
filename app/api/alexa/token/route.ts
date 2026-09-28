import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidClientAuth, readAuthCode } from '@/lib/alexa/oauth';

export const runtime = 'nodejs';

// Access Token URI do Account Linking (chamado pelos servidores da Amazon)
export async function POST(req: Request) {
  try {
    // Alexa envia os dados no formato x-www-form-urlencoded
    const params = new URLSearchParams(await req.text());

    if (!isValidClientAuth(req.headers.get('authorization'), params)) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
    }

    const grantType = params.get('grant_type');
    let refreshTokenToUse: string | null = null;

    if (grantType === 'authorization_code') {
      // Code gerado em /api/alexa/authorize: refresh token cifrado da sessão dedicada
      refreshTokenToUse = readAuthCode(params.get('code') || '', params.get('redirect_uri'));
      if (!refreshTokenToUse) return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    } else if (grantType === 'refresh_token') {
      // Renovação automática quando o access token (1h) expira
      refreshTokenToUse = params.get('refresh_token');
    } else {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }

    if (!refreshTokenToUse) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshTokenToUse });

    if (error || !data.session) {
      console.error('Alexa token: falha ao renovar sessão:', error?.message);
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Formato OAuth2 padrão que a Amazon exige
    return NextResponse.json({
      access_token: data.session.access_token,
      token_type: 'bearer',
      expires_in: data.session.expires_in,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error('Alexa token: erro fatal:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
