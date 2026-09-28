export type AlexaList = { id: string; title: string };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^(a |o |na |no )?lista (de |da |do |das |dos )?/, '')
    .trim();
}

/** Acha a lista pelo nome falado: igual primeiro, depois "contém" (ex.: "mercado" → "Mercado do Mês"). */
export function resolveList(name: string | null | undefined, lists: AlexaList[]): AlexaList | null {
  if (!name) return null;
  const target = normalize(name);
  if (!target) return null;
  return (
    lists.find((l) => normalize(l.title) === target) ||
    lists.find((l) => normalize(l.title).includes(target) || target.includes(normalize(l.title))) ||
    null
  );
}

/** ["a", "b", "c"] → "a, b e c" */
export function joinPt(parts: string[]): string {
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

/** 12.5 → "12 reais e 50 centavos" (como a Alexa deve falar dinheiro) */
export function formatBRL(value: number): string {
  const cents = Math.round(value * 100);
  const reais = Math.floor(cents / 100);
  const rest = cents % 100;
  const r = reais === 1 ? '1 real' : `${reais} reais`;
  if (rest === 0) return r;
  const c = rest === 1 ? '1 centavo' : `${rest} centavos`;
  return reais === 0 ? c : `${r} e ${c}`;
}
