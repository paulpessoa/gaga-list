import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Em Workers, para SSE, mantemos as instâncias em memória enquanto a requisição estiver viva.
// Para produção pesada, Durable Objects é recomendado, mas a memória global resolve o MVP.
let activeTransport: SSEServerTransport | null = null;
let activeServer: Server | null = null;
let currentUserId: string | null = null;

async function initServer(env: Env, userId: string) {
  if (activeServer) return activeServer;

  const server = new Server({ name: "gaga-list-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  server.setRequestHandler("tools/list", async () => ({
    tools: [
      {
        name: "get_active_lists",
        description: "Lista todas as suas listas de compras.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_list_items",
        description: "Lista todos os itens de uma lista específica.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "O ID da lista" }
          },
          required: ["list_id"]
        }
      },
      {
        name: "create_list",
        description: "Cria uma nova lista de compras.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nome da lista" },
            description: { type: "string" },
          },
          required: ["title"],
        },
      },
      {
        name: "add_items_to_list",
        description: "Adiciona múltiplos itens a uma lista de compras.",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "O ID da lista" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number", default: 1 }
                },
                required: ["name"]
              }
            }
          },
          required: ["list_id", "items"]
        }
      },
      {
        name: "toggle_item_status",
        description: "Marca um item como comprado (no carrinho) ou pendente.",
        inputSchema: {
          type: "object",
          properties: {
            item_id: { type: "string", description: "O ID do item" },
            is_purchased: { type: "boolean", description: "true para comprado, false para pendente" }
          },
          required: ["item_id", "is_purchased"]
        }
      }
    ],
  }));

  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === "get_active_lists") {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("owner_id", userId)
        .is("deleted_at", null);

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_list_items") {
      const parsedArgs = z.object({ list_id: z.string() }).parse(args);
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("id")
        .eq("id", parsedArgs.list_id)
        .eq("owner_id", userId)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada ou acesso negado.");

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", parsedArgs.list_id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "create_list") {
      const parsedArgs = z.object({ title: z.string(), description: z.string().optional() }).parse(args);
      const { data, error } = await supabase
        .from("lists")
        .insert({ title: parsedArgs.title, description: parsedArgs.description, owner_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: `Lista criada: ${JSON.stringify(data, null, 2)}` }] };
    }

    if (name === "add_items_to_list") {
      const parsedArgs = z.object({
        list_id: z.string(),
        items: z.array(z.object({ name: z.string(), quantity: z.number().default(1) }))
      }).parse(args);

      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("id")
        .eq("id", parsedArgs.list_id)
        .eq("owner_id", userId)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada ou acesso negado.");

      const itemsToInsert = parsedArgs.items.map(item => ({
        list_id: parsedArgs.list_id,
        name: item.name,
        quantity: item.quantity,
        is_purchased: false,
        added_by: userId
      }));

      const { data, error } = await supabase
        .from("items")
        .insert(itemsToInsert)
        .select();

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: `Itens adicionados: ${JSON.stringify(data, null, 2)}` }] };
    }

    if (name === "toggle_item_status") {
      const parsedArgs = z.object({ item_id: z.string(), is_purchased: z.boolean() }).parse(args);

      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("list_id")
        .eq("id", parsedArgs.item_id)
        .single();
      
      if (itemError || !itemData) throw new Error("Item não encontrado.");

      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("id")
        .eq("id", itemData.list_id)
        .eq("owner_id", userId)
        .single();

      if (listError || !listData) throw new Error("Acesso negado à lista deste item.");

      const { data, error } = await supabase
        .from("items")
        .update({ is_purchased: parsedArgs.is_purchased, checked_by: parsedArgs.is_purchased ? userId : null })
        .eq("id", parsedArgs.item_id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: `Item atualizado: ${JSON.stringify(data, null, 2)}` }] };
    }

    throw new Error(`Tool desconhecida: ${name}`);
  });

  activeServer = server;
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint de Conexão SSE (GET)
    if (url.pathname === "/api/mcp" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response("Unauthorized", { status: 401 });
      }
      const token = authHeader.substring(7);

      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from("api_tokens")
        .select("user_id")
        .eq("token_hash", token)
        .single();

      if (error || !data) {
        return new Response("Token inválido", { status: 401 });
      }

      currentUserId = data.user_id;
      const server = await initServer(env, currentUserId!);
      
      // SSE Transport customizado para Cloudflare Workers
      const { readable, writable } = new TransformStream();
      
      // O SDK aceita um objeto Writable customizado que implemente o método write
      const transport = new SSEServerTransport("/api/mcp/messages", {
        write: (chunk: string) => {
          const writer = writable.getWriter();
          writer.write(new TextEncoder().encode(chunk));
          writer.releaseLock();
        },
        end: () => writable.close()
      } as any);
      
      activeTransport = transport;
      ctx.waitUntil(server.connect(transport));
      
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Endpoint de Mensagens POST
    if (url.pathname === "/api/mcp/messages" && request.method === "POST") {
      if (!activeTransport) {
        return new Response("Sessão SSE não inicializada", { status: 400 });
      }
      
      try {
        const body = await request.json();
        // O transporte oficial processa a mensagem injetando-a no handler
        await activeTransport.handleMessage(body as any);
        return new Response("Accepted", { status: 202 });
      } catch (err) {
        return new Response("Erro ao processar mensagem", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
