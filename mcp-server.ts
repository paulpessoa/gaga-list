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

    throw new Error(`Tool desconhecida: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch(console.error);
