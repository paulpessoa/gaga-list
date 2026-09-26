# GagaList MCP (Cloudflare Worker)

Servidor MCP (Streamable HTTP, stateless) com 5 tools: `get_active_lists`, `get_list_items`, `create_list`, `add_items_to_list`, `toggle_item_status`.

Endpoint: `POST /api/mcp` — autenticação por `Authorization: Bearer gl_live_...` ou `?token=gl_live_...`.

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

## Deploy

```bash
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler deploy
```

No Claude Web (Settings → Connectors → Add custom connector), use a URL:
`https://gagalist-mcp.<seu-subdominio>.workers.dev/api/mcp?token=gl_live_SEU_TOKEN`
