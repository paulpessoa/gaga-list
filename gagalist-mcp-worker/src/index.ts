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

type Access = { role: "owner" | "collaborator" };

async function assertListAccess(supabase: SupabaseClient, listId: string, userId: string): Promise<Access> {
  const { data: list, error } = await supabase
    .from("lists")
    .select("id, owner_id")
    .eq("id", listId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !list) throw new Error("Lista não encontrada ou acesso negado.");
  if (list.owner_id === userId) return { role: "owner" };

  const { data: collab } = await supabase
    .from("list_collaborators")
    .select("list_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!collab) throw new Error("Lista não encontrada ou acesso negado.");
  return { role: "collaborator" };
}

async function getItemListId(supabase: SupabaseClient, itemId: string, userId: string) {
  const { data: item, error } = await supabase.from("items").select("list_id").eq("id", itemId).maybeSingle();
  if (error || !item) throw new Error("Item não encontrado.");
  await assertListAccess(supabase, item.list_id, userId);
  return item.list_id as string;
}

const itemFields = {
  quantity: z.number().positive().optional(),
  unit: z.string().optional().describe("Ex: kg, un, L"),
  category: z.string().optional(),
  price: z.number().nonnegative().optional().describe("Preço em reais"),
  notes: z.string().optional(),
};

function buildServer(supabase: SupabaseClient, userId: string) {
  const server = new McpServer({ name: "gaga-list-mcp", version: "1.1.0" });

  server.registerTool(
    "get_active_lists",
    { description: "Lista as listas de compras criadas por você (onde você é o dono)." },
    async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("id, title, description, icon, created_at, updated_at")
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "get_shared_lists",
    { description: "Lista as listas de compras que outras pessoas compartilharam com você, com o nome do dono." },
    async () => {
      const { data: memberships, error } = await supabase
        .from("list_collaborators")
        .select("list_id, role, joined_at")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      if (!memberships?.length) return text("Nenhuma lista foi compartilhada com você.");

      const { data: lists, error: listsError } = await supabase
        .from("lists")
        .select("id, title, description, icon, created_at, updated_at, owner:profiles!owner_id (full_name, email)")
        .in("id", memberships.map((m) => m.list_id))
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (listsError) throw new Error(listsError.message);

      const byList = new Map(memberships.map((m) => [m.list_id, m]));
      return text(
        (lists ?? []).map((list) => ({
          ...list,
          my_role: byList.get(list.id)?.role,
          joined_at: byList.get(list.id)?.joined_at,
        }))
      );
    }
  );

  server.registerTool(
    "get_list_items",
    {
      description: "Lista todos os itens de uma lista (sua ou compartilhada com você).",
      inputSchema: { list_id: z.string().describe("O ID da lista") },
    },
    async ({ list_id }) => {
      await assertListAccess(supabase, list_id, userId);
      const { data, error } = await supabase
        .from("items")
        .select("id, name, quantity, unit, category, price, notes, is_purchased, checked_at, position, created_at")
        .eq("list_id", list_id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "get_list_collaborators",
    {
      description: "Mostra quem participa de uma lista: o dono e os colaboradores.",
      inputSchema: { list_id: z.string().describe("O ID da lista") },
    },
    async ({ list_id }) => {
      await assertListAccess(supabase, list_id, userId);
      const { data: list, error: listError } = await supabase
        .from("lists")
        .select("owner:profiles!owner_id (full_name, email)")
        .eq("id", list_id)
        .single();
      if (listError) throw new Error(listError.message);

      const { data: collaborators, error } = await supabase
        .from("list_collaborators")
        .select("role, joined_at, profile:profiles (full_name, email)")
        .eq("list_id", list_id);
      if (error) throw new Error(error.message);

      return text({ owner: list.owner, collaborators });
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
      description: "Adiciona um ou mais itens a uma lista (sua ou compartilhada com você).",
      inputSchema: {
        list_id: z.string().describe("O ID da lista"),
        items: z.array(z.object({ name: z.string(), ...itemFields })).min(1),
      },
    },
    async ({ list_id, items }) => {
      await assertListAccess(supabase, list_id, userId);
      const { data, error } = await supabase
        .from("items")
        .insert(
          items.map(({ quantity, ...item }) => ({
            ...item,
            list_id,
            quantity: quantity ?? 1,
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
    "update_item",
    {
      description: "Edita um item: nome, quantidade, unidade, categoria, preço ou observações.",
      inputSchema: {
        item_id: z.string().describe("O ID do item"),
        name: z.string().optional(),
        ...itemFields,
      },
    },
    async ({ item_id, ...changes }) => {
      const updates = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined));
      if (!Object.keys(updates).length) throw new Error("Informe ao menos um campo para alterar.");
      await getItemListId(supabase, item_id, userId);
      const { data, error } = await supabase.from("items").update(updates).eq("id", item_id).select().single();
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
      await getItemListId(supabase, item_id, userId);
      const { data, error } = await supabase
        .from("items")
        .update({
          is_purchased,
          checked_by: is_purchased ? userId : null,
          checked_at: is_purchased ? new Date().toISOString() : null,
        })
        .eq("id", item_id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return text(data);
    }
  );

  server.registerTool(
    "remove_item",
    {
      description: "Remove definitivamente um item de uma lista.",
      inputSchema: { item_id: z.string().describe("O ID do item") },
      annotations: { destructiveHint: true },
    },
    async ({ item_id }) => {
      await getItemListId(supabase, item_id, userId);
      const { data, error } = await supabase.from("items").delete().eq("id", item_id).select("id, name").single();
      if (error) throw new Error(error.message);
      return text(`Item removido: ${data.name}`);
    }
  );

  return server;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
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
      .eq("token_hash", await sha256Hex(token))
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
