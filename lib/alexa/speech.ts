export type AlexaList = { id: string; title: string };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^(a |o |na |no )?lista (de |da |do |das |dos )?/, '')
    .trim();
}

const EMPTY_WORDS = new Set(['', 'null', 'none', 'undefined', 'nenhum', 'nenhuma', 'n/a']);

/** O LLM às vezes devolve o texto "null" em vez de null. */
export function cleanName(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return EMPTY_WORDS.has(trimmed.toLowerCase()) ? null : trimmed;
}

const STOP_WORDS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'na', 'no', 'e', 'lista', 'quero', 'essa', 'esse', 'ponto']);

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/** Escolhe a lista com mais palavras em comum; null se ninguém casar ou se houver empate. */
function bestByTokens(spoken: string, lists: AlexaList[]): AlexaList | null {
  const said = new Set(tokens(spoken));
  if (said.size === 0) return null;
  const scored = lists
    .map((l) => ({ list: l, score: tokens(l.title).filter((t) => said.has(t)).length }))
    .sort((a, b) => b.score - a.score);
  if (!scored[0] || scored[0].score === 0) return null;
  if (scored[1] && scored[1].score === scored[0].score) return null;
  return scored[0].list;
}

/** Acha a lista pelo nome falado: igual, depois "contém", depois palavras em comum. */
export function resolveList(name: string | null | undefined, lists: AlexaList[]): AlexaList | null {
  const clean = cleanName(name);
  if (!clean) return null;
  const target = normalize(clean);
  if (!target) return null;
  return (
    lists.find((l) => normalize(l.title) === target) ||
    lists.find((l) => normalize(l.title).includes(target) || target.includes(normalize(l.title))) ||
    bestByTokens(clean, lists)
  );
}

const ORDINALS: Record<string, number> = {
  primeira: 0, primeiro: 0, '1': 0, um: 0, uma: 0,
  segunda: 1, segundo: 1, '2': 1, dois: 1, duas: 1,
  terceira: 2, terceiro: 2, '3': 2, tres: 2,
  quarta: 3, quarto: 3, '4': 3, quatro: 3,
};

/**
 * Resposta à pergunta "de qual lista?": aceita o nome (mesmo falado de outro jeito,
 * ex.: "citroen c três" → "Citroen C3 1.4 2010"), "a primeira", "a segunda" ou "a última".
 */
export function pickCandidate(reply: string, candidates: AlexaList[]): AlexaList | null {
  const byName = resolveList(reply, candidates);
  if (byName) return byName;
  const words = normalize(reply).split(/[^a-z0-9]+/).filter(Boolean);
  if (words.includes('ultima') || words.includes('ultimo')) return candidates[candidates.length - 1] || null;
  if (words.length <= 3) {
    for (const w of words) {
      const idx = ORDINALS[w];
      if (idx !== undefined && candidates[idx]) return candidates[idx];
    }
  }
  return null;
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
