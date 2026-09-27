# GagaList MCP (Cloudflare Worker)

Servidor MCP (Streamable HTTP, stateless). Tools:

| Tool | O que faz |
|---|---|
| `get_active_lists` | Suas listas (você é o dono) |
| `get_shared_lists` | Listas que compartilharam com você, com o nome do dono |
| `get_list_items` | Itens de uma lista (sua ou compartilhada) |
| `get_list_collaborators` | Dono e colaboradores de uma lista |
| `create_list` | Cria uma lista |
| `add_items_to_list` | Adiciona itens (nome, quantidade, unidade, categoria, preço, observações) |
| `update_item` | Edita um item |
| `toggle_item_status` | Marca como comprado/pendente |
| `remove_item` | Remove um item |

Acesso: dono **ou** colaborador da lista (mesma regra do app).

Endpoint: `POST /api/mcp` — token por `/api/mcp/gl_live_...` (recomendado), `Authorization: Bearer gl_live_...` ou `?token=gl_live_...`.

## Rodar local

```bash
npm install
cp .dev.vars.example .dev.vars   # preencha com a URL e a service role key do Supabase
npx wrangler dev                 # http://localhost:8787
```

Teste rápido (troque pelo seu token):

```bash
curl -s -X POST "http://localhost:8787/api/mcp?token=gl_live_SEU_TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_active_lists","arguments":{}}}'
```

Ou com interface visual: `npx @modelcontextprotocol/inspector` → Transport "Streamable HTTP" → URL `http://localhost:8787/api/mcp?token=gl_live_SEU_TOKEN`.

## Deploy automático (GitHub Actions)

`.github/workflows/deploy-mcp-worker.yml`:
- **Pull request** que mexe em `gagalist-mcp-worker/` → typecheck + build (não publica).
- **Push/merge no `main`** → typecheck + build + deploy na Cloudflare + smoke test.
- Manual: aba Actions → "MCP Worker" → Run workflow.

Secrets do repositório (Settings → Secrets and variables → Actions): `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers") e `CLOUDFLARE_ACCOUNT_ID`.
Os secrets do Supabase ficam na Cloudflare (`wrangler secret put`) e persistem entre deploys.

## Deploy manual

```bash
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler deploy
```

No Claude Web (Settings → Connectors → Add custom connector), use a URL:
`https://gagalist-mcp.<seu-subdominio>.workers.dev/api/mcp/gl_live_SEU_TOKEN` com autenticação **"Sem login"**.
