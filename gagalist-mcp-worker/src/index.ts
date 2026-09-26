import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});

async function assertListOwner(supabase: SupabaseClient, listId: string, userId: string) {
  const { data, error } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Lista não encontrada ou acesso negado.");
}

function buildServer(supabase: SupabaseClient, userId: string) {
  const server = new McpServer({ name: "gaga-list-mcp", version: "1.0.0" });

  server.registerTool(
    "get_active_lists",
    { description: "Lista todas as suas listas de compras." },
    async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("owner_id", userId)
        .is("deleted_at", null);
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "get_list_items",
    {
      description: "Lista todos os itens de uma lista específica.",
      inputSchema: { list_id: z.string().describe("O ID da lista") },
    },
    async ({ list_id }) => {
      await assertListOwner(supabase, list_id, userId);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", list_id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "create_list",
    {
      description: "Cria uma nova lista de compras.",
      inputSchema: {
        title: z.string().describe("Nome da lista"),
        description: z.string().optional(),
      },
    },
    async ({ title, description }) => {
      const { data, error } = await supabase
        .from("lists")
        .insert({ title, description, owner_id: userId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "add_items_to_list",
    {
      description: "Adiciona múltiplos itens a uma lista de compras.",
      inputSchema: {
        list_id: z.string().describe("O ID da lista"),
        items: z.array(z.object({ name: z.string(), quantity: z.number().default(1) })),
      },
    },
    async ({ list_id, items }) => {
      await assertListOwner(supabase, list_id, userId);
      const { data, error } = await supabase
        .from("items")
        .insert(
          items.map((item) => ({
            list_id,
            name: item.name,
            quantity: item.quantity,
            is_purchased: false,
            added_by: userId,
          }))
        )
        .select();
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "toggle_item_status",
    {
      description: "Marca um item como comprado (no carrinho) ou pendente.",
      inputSchema: {
        item_id: z.string().describe("O ID do item"),
        is_purchased: z.boolean().describe("true para comprado, false para pendente"),
      },
    },
    async ({ item_id, is_purchased }) => {
      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("list_id")
        .eq("id", item_id)
        .maybeSingle();
      if (itemError || !item) throw new Error("Item não encontrado.");
      await assertListOwner(supabase, item.list_id, userId);

      const { data, error } = await supabase
        .from("items")
        .update({ is_purchased, checked_by: is_purchased ? userId : null })
        .eq("id", item_id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  return server;
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("GagaList MCP online. Endpoint: /api/mcp", { status: 200 });
    }

    const route = url.pathname.match(/^\/api\/mcp(?:\/([^/]+))?\/?$/);
    if (!route) {
      return new Response("Not Found", { status: 404 });
    }
    const pathToken = route[1];

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : pathToken ?? url.searchParams.get("token");
    if (!token) {
      return withCors(new Response("Unauthorized: envie o token via ?token= ou header Authorization", { status: 401 }));
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: tokenRow, error } = await supabase
      .from("api_tokens")
      .select("user_id")
      .eq("token_hash", token)
      .maybeSingle();
    if (error) {
      return withCors(new Response(`Erro ao validar token no Supabase: ${error.message}`, { status: 500 }));
    }
    if (!tokenRow) {
      return withCors(new Response("Token inválido", { status: 403 }));
    }

    // Stateless: um servidor e um transporte por requisição, isolando cada usuário.
    const server = buildServer(supabase, tokenRow.user_id);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    // O transporte exige Accept com json + event-stream; alguns clientes (PowerShell 5.1, navegador) não enviam.
    const headers = new Headers(request.headers);
    headers.set("Accept", "application/json, text/event-stream");
    return withCors(await transport.handleRequest(new Request(request, { headers })));
  },
};
