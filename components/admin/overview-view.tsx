import type { OverviewMetrics } from "@/lib/admin/metrics"
import { TrendChart } from "@/components/admin/trend-chart"
import {
  PageHeader,
  PeriodFilter,
  Card,
  StatTile,
  BarList,
  brl,
  num,
  pct
} from "@/components/admin/admin-ui"

/** Conteúdo da Visão geral (separado da página para poder testar com dados fictícios). */
export function OverviewView({ m }: { m: OverviewMetrics }) {
  const days = m.periodDays
  const signupDelta =
    m.users.newPrevPeriod > 0
      ? ((m.users.newInPeriod - m.users.newPrevPeriod) / m.users.newPrevPeriod) * 100
      : undefined
  const margin = m.ai.revenue - m.ai.estimatedCost

  return (
    <>
      <PageHeader
        title="Visão geral"
        description={`Saúde do produto nos últimos ${days} dias. Valores de custo e receita são estimativas.`}
        actions={<PeriodFilter basePath="/admin" current={days} />}
      />

      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8983] mb-2">Crescimento</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Usuários" value={num(m.users.total)} hint={`${pct(m.users.pushEnabled, m.users.total)} com push ativo`} />
        <StatTile
          label={`Novos (${days}d)`}
          value={num(m.users.newInPeriod)}
          delta={signupDelta !== undefined ? { value: signupDelta, label: "vs. período anterior" } : undefined}
          hint="sem período anterior para comparar"
        />
        <StatTile label="Ativos (7d)" value={num(m.users.active7d)} hint={pct(m.users.active7d, m.users.total) + " da base"} />
        <StatTile label={`Ativos (${days}d)`} value={num(m.users.activeInPeriod)} hint={pct(m.users.activeInPeriod, m.users.total) + " da base"} />
      </div>

      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8983] mb-2">Uso do app</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Listas ativas" value={num(m.lists.active)} hint={`${num(m.lists.inTrash)} na lixeira`} />
        <StatTile label="Listas compartilhadas" value={num(m.lists.shared)} hint={pct(m.lists.shared, m.lists.active) + " das ativas"} />
        <StatTile label={`Itens adicionados (${days}d)`} value={num(m.items.addedInPeriod)} hint={`${num(m.items.total)} no total`} />
        <StatTile label={`Itens comprados (${days}d)`} value={num(m.items.purchasedInPeriod)} hint="marcados como comprados" />
      </div>

      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8983] mb-2">Dinheiro &amp; IA</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label={`Receita est. (${days}d)`} value={brl(m.ai.revenue)} hint={`${num(m.ai.payingUsers)} pagantes`} />
        <StatTile label={`Custo de IA est. (${days}d)`} value={brl(m.ai.estimatedCost)} hint={`${num(m.ai.calls)} chamadas`} />
        <StatTile label="Margem est." value={brl(margin)} hint={margin >= 0 ? "receita − custo de IA" : "⚠ custo maior que receita"} />
        <StatTile label="Grãos em circulação" value={num(m.ai.creditsInCirculation)} hint={`${num(m.ai.grainsSpent)} gastos no período`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <Card title="Usuários ativos por dia" subtitle="Quem adicionou/marcou item, criou lista, conversou ou usou IA">
          <TrendChart data={m.series.activeUsers} kind="area" />
        </Card>
        <Card title="Novos cadastros por dia">
          <TrendChart data={m.series.signups} />
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <Card title="Itens adicionados por dia">
          <TrendChart data={m.series.itemsAdded} />
        </Card>
        <Card title="Chamadas de IA por feature" subtitle="Custo estimado ao lado">
          <BarList rows={m.aiByFeature.map((f) => ({ label: f.feature, value: f.calls, extra: brl(f.cost) }))} />
        </Card>
      </div>

      <p className="text-[12px] text-[#8a8983] mt-6">
        Catálogo global: {num(m.catalog.globalProducts)} produtos · {num(m.catalog.pendingCuration)} produtos de usuários
        aguardando curadoria.
      </p>
    </>
  )
}
