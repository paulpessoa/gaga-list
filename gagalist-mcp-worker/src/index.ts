import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Em um ambiente Serverless puro, os transportes ativos geralmente precisam ser
// salvos em estado persistente (ex: Durable Objects) se as mensagens POST 
// caírem em isolates diferentes. Como o MCP oficial ainda usa estado de memória
// para instâncias de transporte, a implementação SSE em Cloudflare Workers
// pode precisar de Durable Objects para escalabilidade real.
// Para fins didáticos e uso em baixa escala, usamos memória global.
let activeTransport: SSEServerTransport | null = null;
let activeServer: Server | null = null;

async function initServer(env: Env) {
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
      // ... outras ferramentas idênticas ao mcp-server.ts anterior ...
    ],
  }));

  server.setRequestHandler("tools/call", async (request) => {
    // A validação do token (RLS check) seria feita injetando userId aqui
    // Exemplo: 
    return { content: [{ type: "text", text: "Tool executada com sucesso!" }] };
  });

  activeServer = server;
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/mcp" && request.method === "GET") {
      const server = await initServer(env);
      
      const { readable, writable } = new TransformStream();
      // Nota: o SDK oficial para Node não tipifica 'writable' perfeitamente com Web Streams nativas ainda,
      // essa é uma implementação mock/stub para servir de ponto de partida.
      const transport = new SSEServerTransport("/api/mcp/messages", writable as any);
      activeTransport = transport;
      
      ctx.waitUntil(server.connect(transport));
      
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    if (url.pathname === "/api/mcp/messages" && request.method === "POST") {
      if (!activeTransport) return new Response("Sem transporte ativo", { status: 400 });
      // Lógica de handlePost do transporte oficial
      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  },
};
