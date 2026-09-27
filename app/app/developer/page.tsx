"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MCP_TOOLS = [
  { name: "get_active_lists", description: "Lista as listas de compras criadas por você.", write: false },
  { name: "get_shared_lists", description: "Lista as listas que outras pessoas compartilharam com você.", write: false },
  { name: "get_list_items", description: "Lista os itens de uma lista (sua ou compartilhada).", write: false },
  { name: "get_list_collaborators", description: "Mostra o dono e os colaboradores de uma lista.", write: false },
  { name: "create_list", description: "Cria uma nova lista de compras.", write: true },
  { name: "add_items_to_list", description: "Adiciona um ou mais itens a uma lista.", write: true },
  { name: "update_item", description: "Edita nome, quantidade, unidade, categoria, preço ou observações.", write: true },
  { name: "toggle_item_status", description: "Marca um item como comprado ou pendente.", write: true },
  { name: "remove_item", description: "Remove definitivamente um item de uma lista.", write: true },
];

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export default function DeveloperSettings() {
  const [tokenName, setTokenName] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const handleGenerateToken = async () => {
    if (!tokenName.trim()) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const rawToken = "gl_live_" + toHex(crypto.getRandomValues(new Uint8Array(24)));
      const tokenHash = toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawToken))));

      const { error } = await (supabase as any).from("api_tokens").insert({
        user_id: user.id,
        token_hash: tokenHash,
        name: tokenName,
      });

      if (error) throw error;

      setGeneratedToken(rawToken);
      setTokenName("");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar token.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Developer Settings (MCP)</h1>
      <div className="bg-[#1c1b1b] border border-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 text-white">Acesso ao Model Context Protocol</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Gere tokens pessoais para conectar o GagaList a IAs locais como Claude Desktop ou Cursor.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="tokenName" className="text-sm font-medium text-gray-200">Nome do Token</label>
            <input 
              id="tokenName" 
              placeholder="Ex: Claude Desktop da Empresa" 
              value={tokenName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenName(e.target.value)}
              className="bg-black border border-gray-800 rounded-md p-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#53E076]"
            />
          </div>
          
          <button 
            onClick={handleGenerateToken} 
            disabled={!tokenName || isLoading}
            className="w-full bg-[#53E076] text-black font-semibold rounded-md py-2 hover:bg-[#53E076]/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Gerando..." : "Gerar Token"}
          </button>

          {generatedToken && (
            <div className="mt-6 p-4 bg-black border border-[#53E076] rounded-md">
              <p className="text-sm text-gray-400 mb-2">
                Copie seu token agora. Ele não será exibido novamente.
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[#53E076] break-all block p-2 bg-gray-900 rounded flex-1">
                  {generatedToken}
                </code>
                <button
                  onClick={handleCopy}
                  className="bg-gray-800 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1 font-medium text-sm"
                >
                  {copied ? "✅ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1c1b1b] border border-gray-800 rounded-lg p-6 shadow-sm mt-6">
        <h2 className="text-xl font-semibold mb-2 text-white">Ferramentas disponíveis ({MCP_TOOLS.length})</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Com o token conectado, a IA pode usar estas ferramentas nas suas listas.
        </p>
        <ul className="divide-y divide-gray-800">
          {MCP_TOOLS.map((tool) => (
            <li key={tool.name} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <code className="text-[#53E076] text-sm break-all">{tool.name}</code>
                <p className="text-gray-400 text-sm">{tool.description}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                  tool.write ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"
                }`}
              >
                {tool.write ? "escrita" : "leitura"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
