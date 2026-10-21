import Link from "next/link"

/**
 * Peças visuais do painel admin. Sem "use client": podem ser usadas direto
 * em Server Components (as páginas do /admin buscam dados no servidor).
 */

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-[#52514e] mt-1">{description}</p>}
      </div>
      {actions}
    </header>
  )
}

/** Filtro de período via querystring (?dias=7|30|90) — funciona sem JS. */
export function PeriodFilter({ basePath, current }: { basePath: string; current: number }) {
  return (
    <div className="inline-flex rounded-md border border-[#e4e3df] bg-white p-0.5 text-[12px] font-medium">
      {[7, 30, 90].map((d) => (
        <Link
          key={d}
          href={`${basePath}?dias=${d}`}
          aria-current={current === d ? "true" : undefined}
          className={`px-3 py-1.5 rounded ${
            current === d ? "bg-[#0b0b0b] text-white" : "text-[#52514e] hover:text-[#0b0b0b]"
          }`}
        >
          {d} dias
        </Link>
      ))}
    </div>
  )
}

export function Card({
  title,
  subtitle,
  children,
  className = ""
}: {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-[#e4e3df] bg-white ${className}`}>
      {title && (
        <div className="px-4 pt-4">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#8a8983] mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function StatTile({
  label,
  value,
  hint,
  delta
}: {
  label: string
  value: string
  hint?: string
  delta?: { value: number; label: string }
}) {
  return (
    <div className="rounded-lg border border-[#e4e3df] bg-white p-4">
      <p className="text-[12px] font-medium text-[#52514e]">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">{value}</p>
      {(hint || delta) && (
        <p className="text-[12px] text-[#8a8983] mt-1">
          {delta && (
            <span className={delta.value >= 0 ? "text-[#0d7a3f]" : "text-[#b42318]"}>
              {delta.value >= 0 ? "▲" : "▼"} {Math.abs(delta.value).toFixed(0)}%{" "}
            </span>
          )}
          {delta?.label ?? hint}
        </p>
      )}
    </div>
  )
}

/** Barras horizontais em HTML puro: legível, acessível e sem JS. */
export function BarList({
  rows,
  format = (n) => n.toLocaleString("pt-BR")
}: {
  rows: { label: string; value: number; extra?: string }[]
  format?: (n: number) => string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <EmptyState text="Sem dados no período." />
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-[12px]">
          <div className="flex justify-between gap-3 mb-1">
            <span className="font-medium truncate">{r.label}</span>
            <span className="tabular-nums text-[#52514e]">
              {format(r.value)}
              {r.extra && <span className="text-[#8a8983]"> · {r.extra}</span>}
            </span>
          </div>
          <div className="h-2 rounded bg-[#f0efec]">
            <div className="h-2 rounded bg-[#2a78d6]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-[13px] text-[#8a8983] py-6 text-center">{text}</p>
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })

export const num = (n: number) => n.toLocaleString("pt-BR")

export const pct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toFixed(0)}%` : "—"

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }) : "—"
