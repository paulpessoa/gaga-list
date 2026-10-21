import { getAiUsage, parsePeriod } from "@/lib/admin/metrics"
import { requireAdmin } from "@/lib/admin/guard"
import { API_COSTS } from "@/lib/admin/costs"
import { TrendChart } from "@/components/admin/trend-chart"
import { PageHeader, PeriodFilter, Card, BarList, EmptyState, brl, num } from "@/components/admin/admin-ui"

export default async function AdminAiPage({
  searchParams
}: {
  searchParams: Promise<{ dias?: string }>
}) {
  await requireAdmin()
  const days = parsePeriod((await searchParams).dias)
  const ai = await getAiUsage(days)
  const totalCalls = ai.features.reduce((s, f) => s + f.calls, 0)
  const totalCost = ai.features.reduce((s, f) => s + f.cost, 0)

  return (
    <>
      <PageHeader
        title="Uso de IA"
        description={`${num(totalCalls)} chamadas · ${brl(totalCost)} de custo estimado nos últimos ${days} dias`}
        actions={<PeriodFilter basePath="/admin/ia" current={days} />}
      />

      <div className="grid lg:grid-cols-3 gap-3 mb-3">
        <Card title="Chamadas por dia" className="lg:col-span-2">
          <TrendChart data={ai.callsByDay} />
        </Card>
        <Card title="Por modelo registrado">
          <BarList rows={ai.models.map((m) => ({ label: m.model, value: m.calls }))} />
        </Card>
      </div>

      <Card title="Por feature" subtitle="Custo estimado = chamadas × tabela de custo (lib/admin/costs.ts)" className="mb-3">
        {ai.features.length === 0 ? (
          <EmptyState text="Nenhuma chamada no período." />
        ) : (
          <div className="-mx-4 -mb-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f7f7f5] text-[11px] uppercase tracking-wide text-[#8a8983]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Feature</th>
                  <th className="px-4 py-2.5 font-semibold">Modelo de referência</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Chamadas</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Usuários</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Grãos</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Custo est.</th>
                  <th className="px-4 py-2.5 font-semibold text-right">R$/chamada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efec]">
                {ai.features.map((f) => (
                  <tr key={f.feature}>
                    <td className="px-4 py-2.5 font-medium">{f.feature}</td>
                    <td className="px-4 py-2.5 text-[#52514e]">{API_COSTS[f.feature]?.model ?? "— sem custo cadastrado"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(f.calls)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(f.users)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(f.grains)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{brl(f.cost)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#52514e]">
                      {(API_COSTS[f.feature]?.estimated_brl ?? 0).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Últimos 50 registros" subtitle="Inclui recargas (grãos negativos = crédito comprado)">
        {ai.recent.length === 0 ? (
          <EmptyState text="Nenhum registro ainda." />
        ) : (
          <div className="-mx-4 -mb-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f7f7f5] text-[11px] uppercase tracking-wide text-[#8a8983]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Quando</th>
                  <th className="px-4 py-2.5 font-semibold">Usuário</th>
                  <th className="px-4 py-2.5 font-semibold">Feature</th>
                  <th className="px-4 py-2.5 font-semibold">Modelo</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Grãos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efec]">
                {ai.recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-[#52514e] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{r.user?.full_name || "—"}</div>
                      <div className="text-[12px] text-[#8a8983]">{r.user?.email}</div>
                    </td>
                    <td className="px-4 py-2.5">{r.cost < 0 ? "recarga" : r.feature}</td>
                    <td className="px-4 py-2.5 text-[#52514e]">{r.model_used || "—"}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${r.cost < 0 ? "text-[#0d7a3f]" : ""}`}>
                      {r.cost < 0 ? `+${num(-r.cost)}` : num(r.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
