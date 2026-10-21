# Painel Admin (`/admin`)

Backoffice para acompanhar os números do GagaList. Visual propositalmente diferente do app
(claro, denso, sem neon) para deixar claro que é área de operação.

## Rotas
| Rota | O que mostra |
|---|---|
| `/admin` | Visão geral: usuários (total, novos, ativos 7d/período), listas, itens, receita e custo de IA estimados, gráficos diários |
| `/admin/usuarios` | Tabela paginada com busca: cadastro, última atividade, listas, uso de IA, grãos, push |
| `/admin/ia` | Chamadas por dia, por modelo, por feature (custo estimado) e últimos 50 registros |
| `/admin/curadoria` | Promover produtos de usuários para o catálogo global (migrado do admin antigo) |
| `/admin/configuracoes` | Custos em grãos em vigor x gravados no banco, planos e tabela de custo de IA (somente leitura) |

`/app/admin` e `/app/admin/settings` redirecionam para cá.

## Segurança
- `lib/admin/guard.ts` → `requireAdmin()` roda **no servidor** (layout e cada página). Sem sessão → `/`; sem `profiles.is_admin` → `/app`.
- As métricas usam a `SUPABASE_SERVICE_ROLE_KEY` (ignora RLS) **só depois** da checagem. Nada disso vai para o navegador.
- A curadoria continua usando o client do navegador + políticas RLS de admin já existentes.

## Como virar admin
No SQL Editor do Supabase:
```sql
update public.profiles set is_admin = true where email = 'seu@email.com';
```

## Migrations
**Nenhuma obrigatória.** Existe uma opcional, só de índices:
`supabase/migrations/20261021090000_admin_metrics_indexes.sql` (idempotente, não mexe em dados nem RLS).

## Como as métricas são calculadas
- **Usuário ativo** = fez algo registrado no banco no dia: adicionou/marcou item, criou lista, mandou mensagem ou usou IA. (Ainda não existe `last_seen_at`.)
- **Custo de IA** = chamadas × tabela `lib/admin/costs.ts` (estimativa; ajuste ao trocar modelo).
- **Receita** = recargas (`ai_usage_logs` com `cost < 0`) casadas com o preço do plano em `PLAN_CONFIGS`.

## Escalando as métricas (quando precisar)
Hoje agregamos em JS (`lib/admin/metrics.ts`), paginando de 1000 em 1000. Ótimo até dezenas de milhares de linhas.
Depois disso: criar funções SQL `security definer` que checam `public.is_admin()` e devolvem os agregados
(ex.: `admin_daily_activity(days int)`), e trocar as chamadas em `metrics.ts` por `db.rpc(...)`.

## Decisão pendente: fonte da verdade dos custos
O admin antigo gravava custos em `system_settings`, mas as rotas de IA leem só variáveis de ambiente
(`SettingsService.getAICosts()`). Opções:
1. **Manter env** (atual): simples, exige redeploy para mudar. → remover `system_settings` no futuro.
2. **Ler do banco com cache** (ex.: 5 min): admin altera sem deploy. → trocar `getAICosts()` por `getAICostsFromDB()` com cache e reativar edição em `/admin/configuracoes`.
