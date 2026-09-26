import { NextRequest, NextResponse } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Global state to store SSE transports (works locally or on stateful servers)
const transports = new Map<string, SSEServerTransport>();

// We will use the service role key to execute queries securely by filtering on user_id manually.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper para validar o Bearer token e retornar o user_id correspondente
 */
async function authenticateUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);

  const { data, error } = await (supabase as any)
    .from("api_tokens")
    .select("user_id")
    .eq("token_hash", token)
    .single();

  if (error || !data) return null;

  // Atualiza last_used_at de forma assíncrona
  (supabase as any)
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", token)
    .then();

  return data.user_id;
}

/**
 * Inicializa o Server MCP e registra as ferramentas
 */
function createMcpServer(userId: string) {
  const server = new Server(
    {
      name: "gagalist-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define as ferramentas disponíveis
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_active_lists",
          description: "Retorna as listas de compras ativas do usuário.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "create_list",
          description: "Cria uma nova lista de compras.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "O nome da lista" },
              description: { type: "string", description: "Descrição opcional" },
            },
            required: ["title"],
          },
        },
      ],
    };
  });

  // Executa as ferramentas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "get_active_lists") {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar listas: ${error.message}`);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "create_list") {
      const parsedArgs = z
        .object({ title: z.string(), description: z.string().optional() })
        .parse(args);

      const { data, error } = await supabase
        .from("lists")
        .insert({
          title: parsedArgs.title,
          description: parsedArgs.description,
          owner_id: userId,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(`Erro ao criar lista: ${error.message}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Lista criada com sucesso: ${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    }

    throw new Error(`Tool unknown: ${name}`);
  });

  return server;
}

export async function GET(req: NextRequest) {
  const userId = await authenticateUser(req);
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Implementation note: `@modelcontextprotocol/sdk` SSE transport currently 
  // requires standard Node.js Request/Response objects to work correctly.
  // In Next.js App Router, we would need a custom transport that wraps `ReadableStream`.
  // For the sake of the MVP, we are mocking the endpoint structure.
  
  return new NextResponse("SSE Transport requires standard Node.js adapter or custom stream. Use stdio for local MVP.", { status: 501 });
}

export async function POST(req: NextRequest) {
  const userId = await authenticateUser(req);
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Handle incoming JSON-RPC messages from the client
  return new NextResponse("Not implemented", { status: 501 });
}
