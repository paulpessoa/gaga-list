import { getOverviewMetrics, parsePeriod } from "@/lib/admin/metrics"
import { requireAdmin } from "@/lib/admin/guard"
import { OverviewView } from "@/components/admin/overview-view"

export default async function AdminOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ dias?: string }>
}) {
  // O layout já protege, mas checamos de novo: páginas e layouts renderizam em paralelo.
  await requireAdmin()
  const days = parsePeriod((await searchParams).dias)
  return <OverviewView m={await getOverviewMetrics(days)} />
}
