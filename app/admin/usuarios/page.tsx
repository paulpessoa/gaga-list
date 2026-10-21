import Link from "next/link"
import { getUsers } from "@/lib/admin/metrics"
import { requireAdmin } from "@/lib/admin/guard"
import { PageHeader, Card, EmptyState, num, fmtDate } from "@/components/admin/admin-ui"

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; p?: string }>
}) {
  await requireAdmin()
  const { q = "", p } = await searchParams
  const page = Math.max(1, Number(p) || 1)
  const { rows, total, perPage } = await getUsers({ q, page })
  const pages = Math.max(1, Math.ceil(total / perPage))
  const href = (n: number) => `/admin/usuarios?${new URLSearchParams({ ...(q ? { q } : {}), p: String(n) })}`

  return (
    <>
      <PageHeader
        title="Usuários"
        description={`${num(total)} ${q ? "encontrados" : "cadastrados"} · mais recentes primeiro`}
        actions={
          <form className="flex gap-2" action="/admin/usuarios">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou e-mail"
              className="w-64 rounded-md border border-[#e4e3df] bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#2a78d6]"
            />
            <button className="rounded-md bg-[#0b0b0b] px-3 py-1.5 text-[13px] font-medium text-white">Buscar</button>
          </form>
        }
      />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState text="Nenhum usuário encontrado." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f7f7f5] text-[11px] uppercase tracking-wide text-[#8a8983]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Usuário</th>
                  <th className="px-4 py-2.5 font-semibold">Cadastro</th>
                  <th className="px-4 py-2.5 font-semibold">Última atividade</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Listas</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Uso de IA</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Grãos</th>
                  <th className="px-4 py-2.5 font-semibold">Push</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efec]">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafaf9]">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">
                        {u.full_name || "Sem nome"}
                        {u.is_admin && (
                          <span className="ml-2 rounded bg-[#2a78d6]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#1d5fae]">ADMIN</span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#8a8983]">{u.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[#52514e] whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-2.5 text-[#52514e] whitespace-nowrap">{fmtDate(u.lastActivity)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(u.listsOwned)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(u.aiCalls)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{num(u.credits ?? 0)}</td>
                    <td className="px-4 py-2.5 text-[#52514e]">{u.push ? "Sim" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-[13px]" aria-label="Paginação">
          <span className="text-[#8a8983]">
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href(page - 1)} className="rounded-md border border-[#e4e3df] bg-white px-3 py-1.5 hover:bg-[#f0efec]">
                Anterior
              </Link>
            )}
            {page < pages && (
              <Link href={href(page + 1)} className="rounded-md border border-[#e4e3df] bg-white px-3 py-1.5 hover:bg-[#f0efec]">
                Próxima
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  )
}
