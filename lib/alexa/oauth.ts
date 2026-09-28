import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Helpers do Account Linking (OAuth2 Auth Code Grant) entre Alexa e Gaga List.
 *
 * O "authorization code" é o refresh token de uma sessão DEDICADA à Alexa,
 * cifrado com AES-256-GCM (chave derivada do ALEXA_CLIENT_SECRET) e com validade
 * de 5 minutos. Assim não precisamos de tabela no banco e o token nunca trafega legível.
 */

const CODE_TTL_MS = 5 * 60 * 1000;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada`);
  return value;
}

function key(): Buffer {
  return createHash('sha256').update(env('ALEXA_CLIENT_SECRET')).digest();
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isValidClientId(clientId: string | null | undefined): boolean {
  return !!clientId && safeEqual(clientId, env('ALEXA_CLIENT_ID'));
}

/** Aceita só os "Alexa Redirect URLs" copiados do console (ALEXA_REDIRECT_URIS, separados por vírgula). */
export function isAllowedRedirectUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  const allowed = env('ALEXA_REDIRECT_URIS').split(',').map((u) => u.trim()).filter(Boolean);
  return allowed.includes(uri);
}

/** Aceita credenciais via HTTP Basic (recomendado no console) ou no corpo do form. */
export function isValidClientAuth(authorization: string | null, form: URLSearchParams): boolean {
  let id = form.get('client_id');
  let secret = form.get('client_secret');
  if (authorization?.toLowerCase().startsWith('basic ')) {
    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep > -1) {
      id = decodeURIComponent(decoded.slice(0, sep));
      secret = decodeURIComponent(decoded.slice(sep + 1));
    }
  }
  return isValidClientId(id) && !!secret && safeEqual(secret, env('ALEXA_CLIENT_SECRET'));
}

type CodePayload = { rt: string; ru: string; exp: number };

export function createAuthCode(refreshToken: string, redirectUri: string, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const payload: CodePayload = { rt: refreshToken, ru: redirectUri, exp: now + CODE_TTL_MS };
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

/** Retorna o refresh token, ou null se o code for inválido, expirado ou de outro redirect_uri. */
export function readAuthCode(code: string, redirectUri: string | null, now = Date.now()): string | null {
  try {
    const buf = Buffer.from(code, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
    const payload = JSON.parse(json) as CodePayload;
    if (payload.exp < now) return null;
    if (redirectUri && redirectUri !== payload.ru) return null;
    return payload.rt;
  } catch {
    return null;
  }
}
