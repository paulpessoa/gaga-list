"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

      const rawToken = "gl_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { error } = await (supabase as any).from("api_tokens").insert({
        user_id: user.id,
        token_hash: rawToken,
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
    </div>
  );
}
