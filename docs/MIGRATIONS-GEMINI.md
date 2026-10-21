# Como pedir ao Gemini CLI para aplicar as migrations

Situação atual: **nenhuma migration é obrigatória** para os PRs de out/2026.
A única nova é opcional: `supabase/migrations/20261021090000_admin_metrics_indexes.sql` (só índices).

## Passo a passo (máquina local)
```bash
git checkout main && git pull
npm install
supabase login            # se ainda não estiver logado
supabase link --project-ref qcejgeazpduqpnsakqvn   # só na 1ª vez
gemini                    # abre o Gemini CLI na raiz do repo
```

## Prompt para colar no Gemini
```
Leia docs/MIGRATIONS-GEMINI.md, docs/REVISAO-2026-10.md e docs/admin/README.md.
Depois:
1. Rode `supabase migration list` e me mostre quais migrations locais ainda não estão no remoto.
2. Para cada migration pendente, abra o arquivo, explique em 1 linha o que faz e se mexe em dados/RLS.
3. NÃO aplique nada ainda. Me pergunte "posso aplicar?".
4. Se eu disser sim, rode `supabase db push` e depois `supabase migration list` de novo para confirmar.
5. Se der erro, pare, me mostre o erro e NÃO tente "consertar" editando migrations já aplicadas.
Regras: use `supabase` (não `npx supabase`), nunca rode `supabase db reset` no remoto, nunca desabilite RLS.
```

## Se preferir o SQL Editor do Supabase (sem CLI)
1. Abra o arquivo `.sql`, copie todo o conteúdo.
2. Supabase → SQL Editor → New query → cole → Run.
3. Como a CLI não ficou sabendo, registre depois: `supabase migration repair --status applied 20261021090000`.

## Para virar admin e testar o painel
```sql
update public.profiles set is_admin = true where email = 'paulmspessoa@gmail.com';
```
Depois abra `/admin`.
