"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

const SERIES = "#2a78d6"
const GRID = "#ecebe7"
const AXIS = "#8a8983"

const shortDay = (day: string) => {
  const [, m, d] = day.split("-")
  return `${d}/${m}`
}

/**
 * Série diária de UMA métrica (sem legenda: o título do card nomeia a série).
 * - "bar": contagens discretas por dia (cadastros, itens)
 * - "area": tendência contínua (usuários ativos)
 */
export function TrendChart({
  data,
  kind = "bar",
  unit = ""
}: {
  data: { day: string; value: number }[]
  kind?: "bar" | "area"
  unit?: string
}) {
  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: -16 }
  }
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis
        dataKey="day"
        tickFormatter={shortDay}
        tick={{ fontSize: 11, fill: AXIS }}
        axisLine={false}
        tickLine={false}
        minTickGap={24}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 11, fill: AXIS }}
        axisLine={false}
        tickLine={false}
        width={40}
      />
      <Tooltip
        cursor={{ fill: "rgba(42,120,214,0.06)", stroke: GRID }}
        labelFormatter={(d) => shortDay(String(d))}
        formatter={(v) => [`${Number(v).toLocaleString("pt-BR")}${unit}`, ""]}
        separator=""
        contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#e4e3df" }}
      />
    </>
  )

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "area" ? (
          <AreaChart {...common}>
            {axes}
            <Area type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2} fill={SERIES} fillOpacity={0.12} />
          </AreaChart>
        ) : (
          <BarChart {...common} barCategoryGap={2}>
            {axes}
            <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
