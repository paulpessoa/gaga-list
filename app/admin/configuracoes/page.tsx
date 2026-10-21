import { requireAdmin } from "@/lib/admin/guard"
import { getStoredSettings } from "@/lib/admin/metrics"
import { API_COSTS } from "@/lib/admin/costs"
import { DEFAULT_AI_COSTS, PLAN_CONFIGS } from "@/services/settings.service"
import { PageHeader, Card, brl, num } from "@/components/admin/admin-ui"

const LABELS: Record<string, string> = {
  cost_recipe: "Receita (3 sugestões)",
  cost_ocr: "OCR de lista (foto)",
  cost_vision: "Identificar produto (foto)",
  cost_voice: "Comando de voz",
  cost_suggestion: "Sugestões / benefícios",
  cost_agent: "Mensagem à assistente Gaga",
  cost_live_minute: "Minuto de voz ao vivo",
  referral_bonus: "Bônus de indicação"
}

const ENV_NAME: Record<string, string> = {
  cost_recipe: "NEXT_PUBLIC_COST_RECIPE",
  cost_ocr: "NEXT_PUBLIC_COST_OCR",
  cost_vision: "NEXT_PUBLIC_COST_VISION",
  cost_voice: "NEXT_PUBLIC_COST_VOICE",
  cost_suggestion: "NEXT_PUBLIC_COST_SUGGESTION",
  cost_agent: "NEXT_PUBLIC_COST_AGENT",
  cost_live_minute: "NEXT_PUBLIC_COST_LIVE_MINUTE",
  referral_bonus: "NEXT_PUBLIC_REFERRAL_BONUS"
}

/**
 * Configurações em modo LEITURA.
 *
 * PORQUÊ (achado da revisão): o admin antigo salvava custos na tabela
 * `system_settings`, mas as rotas de IA leem `SettingsService.getAICosts()`, que
 * usa só variáveis de ambiente. Ou seja: salvar ali não mudava nada.
 * Até decidirmos a fonte da verdade (ver docs/admin/README.md), esta tela mostra
 * o valor EM VIGOR e o valor gravado no banco lado a lado.
 */
export default async function AdminSettingsPage() {
  await requireAdmin()
  const stored = await getStoredSettings()
  const storedMap = new Map(stored.map((s) => [s.key, s.value]))

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Custos em grãos, planos e tabela de custo de IA. Somente leitura por enquanto."
      />

      <div className="rounded-lg border border-[#f5d48a] bg-[#fff8e6] p-4 text-[13px] text-[#6b4e00] mb-4">
        <strong>Como alterar hoje:</strong> os valores em vigor vêm das variáveis de ambiente (Vercel → Settings →
        Environment Variables) e exigem novo deploy. A coluna “No banco” é o que o admin antigo gravava em{" "}
        <code>system_settings</code> e <strong>não é lida pelo app</strong>.
      </div>

      <Card title="Custo de cada ação (grãos)" className="mb-3">
        <div className="-mx-4 -mb-4 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f7f7f5] text-[11px] uppercase tracking-wide text-[#8a8983]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Ação</th>
                <th className="px-4 py-2.5 font-semibold text-right">Em vigor</th>
                <th className="px-4 py-2.5 font-semibold text-right">No banco</th>
                <th className="px-4 py-2.5 font-semibold">Variável de ambiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0efec]">
              {Object.entries(DEFAULT_AI_COSTS).map(([key, value]) => {
                const db = storedMap.get(key)
                const differs = db !== undefined && Number(db) !== value
                return (
                  <tr key={key}>
                    <td className="px-4 py-2.5 font-medium">{LABELS[key] ?? key}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{num(value)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${differs ? "text-[#b42318]" : "text-[#8a8983]"}`}>
                      {db === undefined ? "—" : String(db)}
                      {differs && " ≠"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#52514e]">{ENV_NAME[key]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card title="Planos (Stripe)">
          <ul className="divide-y divide-[#f0efec] text-[13px]">
            {Object.entries(PLAN_CONFIGS).map(([key, p]) => (
              <li key={key} className="flex justify-between py-2">
                <span className="font-medium">{p.name}</span>
                <span className="tabular-nums text-[#52514e]">
                  {num(p.grains)} grãos · {p.amount ? brl(p.amount / 100) : "Grátis"}
                  {p.amount > 0 && <> · {brl(p.amount / 100 / p.grains)}/grão</>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Custo estimado por chamada de IA" subtitle="Editar em lib/admin/costs.ts">
          <ul className="divide-y divide-[#f0efec] text-[13px]">
            {Object.entries(API_COSTS).map(([key, c]) => (
              <li key={key} className="flex justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{key}</span>{" "}
                  <span className="text-[12px] text-[#8a8983]">{c.model}</span>
                </span>
                <span className="tabular-nums text-[#52514e] whitespace-nowrap">R$ {c.estimated_brl.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
