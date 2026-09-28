import { NextResponse } from 'next/server';
import { createAuthCode, isAllowedRedirectUri, isValidClientId } from '@/lib/alexa/oauth';

export const runtime = 'nodejs';

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

// GET: a página /alexa/link valida os parâmetros antes de mostrar o login
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (!isValidClientId(searchParams.get('client_id'))) return badRequest('invalid_client');
  if (!isAllowedRedirectUri(searchParams.get('redirect_uri'))) return badRequest('invalid_redirect_uri');
  return NextResponse.json({ ok: true });
}

// POST: recebe o refresh token da sessão dedicada e devolve a URL de retorno para a Amazon
export async function POST(req: Request) {
  try {
    const { client_id, redirect_uri, state, refresh_token } = await req.json();

    if (!isValidClientId(client_id)) return badRequest('invalid_client');
    if (!isAllowedRedirectUri(redirect_uri)) return badRequest('invalid_redirect_uri');
    if (!state || !refresh_token) return badRequest('invalid_request');

    const url = new URL(redirect_uri);
    url.searchParams.set('state', state);
    url.searchParams.set('code', createAuthCode(refresh_token, redirect_uri));

    return NextResponse.json({ redirect: url.toString() });
  } catch (err) {
    console.error('Alexa authorize: erro fatal:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
