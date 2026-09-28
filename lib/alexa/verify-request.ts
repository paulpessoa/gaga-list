import { X509Certificate, createVerify } from 'node:crypto';
import { rootCertificates } from 'node:tls';
import path from 'node:path';

/**
 * Verificação obrigatória para skills com endpoint HTTPS próprio.
 * Ref: https://developer.amazon.com/docs/custom-skills/host-a-custom-skill-as-a-web-service.html
 *
 * 1. SignatureCertChainUrl aponta para s3.amazonaws.com/echo.api/ (https, porta 443)
 * 2. Cadeia de certificados válida, até uma CA raiz confiável, com SAN echo-api.amazon.com
 * 3. Header Signature-256 confere com o corpo bruto (SHA256withRSA)
 * 4. Timestamp com no máximo 150 segundos de diferença
 * 5. applicationId igual ao ALEXA_SKILL_ID
 */

const MAX_TIMESTAMP_SKEW_MS = 150 * 1000;
const SAN_HOST = 'echo-api.amazon.com';

const trustedRoots = rootCertificates.map((pem) => new X509Certificate(pem));
const certCache = new Map<string, X509Certificate>();

export class AlexaVerificationError extends Error {}

export function isValidCertChainUrl(raw: string | null): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.hostname.toLowerCase() === 's3.amazonaws.com' &&
    (url.port === '' || url.port === '443') &&
    path.posix.normalize(url.pathname).startsWith('/echo.api/')
  );
}

export function splitPemChain(pem: string): X509Certificate[] {
  const blocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
  return blocks.map((b) => new X509Certificate(b));
}

export function validateCertChain(chain: X509Certificate[], now = new Date(), roots = trustedRoots): X509Certificate {
  if (chain.length === 0) throw new AlexaVerificationError('cadeia de certificados vazia');

  const leaf = chain[0];
  const sans = (leaf.subjectAltName || '').split(',').map((s) => s.trim());
  if (!sans.includes(`DNS:${SAN_HOST}`)) throw new AlexaVerificationError('SAN inválido');

  const isAnchored = (cert: X509Certificate) =>
    roots.some((root) => cert.fingerprint256 === root.fingerprint256 || (cert.checkIssued(root) && cert.verify(root.publicKey)));

  // Sobe a cadeia a partir do leaf até achar um certificado emitido por uma CA raiz confiável.
  // A Amazon envia certificados com assinatura cruzada no topo, então a âncora pode estar no meio.
  for (let i = 0; i < chain.length; i++) {
    const cert = chain[i];
    if (new Date(cert.validFrom) > now || new Date(cert.validTo) < now) {
      throw new AlexaVerificationError('certificado fora da validade');
    }
    if (isAnchored(cert)) return leaf;
    const issuer = chain[i + 1];
    if (!issuer || !cert.checkIssued(issuer) || !cert.verify(issuer.publicKey)) break;
  }

  throw new AlexaVerificationError('cadeia não termina em CA confiável');
}

async function getSigningCert(url: string): Promise<X509Certificate> {
  const cached = certCache.get(url);
  if (cached && new Date(cached.validTo) > new Date()) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new AlexaVerificationError(`falha ao baixar certificado (${res.status})`);
  const leaf = validateCertChain(splitPemChain(await res.text()));
  certCache.set(url, leaf);
  return leaf;
}

export function verifySignature(cert: X509Certificate, signatureB64: string, rawBody: string): boolean {
  const verifier = createVerify('RSA-SHA256');
  verifier.update(rawBody, 'utf8');
  return verifier.verify(cert.publicKey, signatureB64, 'base64');
}

export function isFreshTimestamp(timestamp: string | undefined, now = Date.now()): boolean {
  if (!timestamp) return false;
  const ts = Date.parse(timestamp);
  return !Number.isNaN(ts) && Math.abs(now - ts) <= MAX_TIMESTAMP_SKEW_MS;
}

export async function verifyAlexaRequest(rawBody: string, body: any, headers: Headers): Promise<void> {
  // Atalho só para testes locais (curl/ngrok). Nunca vale em produção.
  if (process.env.ALEXA_SKIP_VERIFICATION === 'true' && process.env.NODE_ENV !== 'production') return;

  const skillId = process.env.ALEXA_SKILL_ID;
  const appId = body?.session?.application?.applicationId || body?.context?.System?.application?.applicationId;
  if (!skillId || appId !== skillId) throw new AlexaVerificationError('applicationId inválido');

  if (!isFreshTimestamp(body?.request?.timestamp)) throw new AlexaVerificationError('timestamp expirado');

  const certUrl = headers.get('signaturecertchainurl');
  const signature = headers.get('signature-256');
  if (!isValidCertChainUrl(certUrl) || !signature) throw new AlexaVerificationError('headers de assinatura inválidos');

  const cert = await getSigningCert(certUrl!);
  if (!verifySignature(cert, signature, rawBody)) throw new AlexaVerificationError('assinatura inválida');
}
