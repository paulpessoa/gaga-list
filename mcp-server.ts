import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam variáveis de ambiente do Supabase (.env)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function authenticateToken(token: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("api_tokens")
    .select("user_id")
    .eq("token_hash", token)
    .single();

  if (error || !data) return null;
  return data.user_id;
}

async function run() {
  const token = process.env.GAGALIST_API_KEY;
  if (!token) {
    console.error("Falta a variável GAGALIST_API_KEY. Por favor gere um token no app e exporte.");
    process.exit(1);
  }

  const userId = await authenticateToken(token);
  if (!userId) {
    console.error("Token inválido ou não encontrado no Supabase.");
    process.exit(1);
  }

  const server = new Server(
    { name: "gagalist-mcp-local", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
      // Validar se o usuário tem acesso à lista (dono ou colaborador) - Para o MVP, validamos dono
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

      // Validação de acesso à lista
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

      // Precisaríamos verificar se o item pertence a uma lista do usuário.
      // Para manter seguro com Service Role, fazemos um sub-select ou confiamos no RLS se fosse usado token.
      // Como estamos com Service Role, vamos verificar o dono da lista indiretamente.
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch(console.error);
