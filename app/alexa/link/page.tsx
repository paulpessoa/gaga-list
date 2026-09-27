"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

function AlexaLinkContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const redirectUri = searchParams.get("redirect_uri");
  const clientId = searchParams.get("client_id");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Initialize client-side supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionInfo(session);
      }
    });
  }, [supabase.auth]);

  const handleLink = () => {
    if (!sessionInfo?.refresh_token || !redirectUri) return;
    
    // We encode the refresh token in base64 to send as the "auth code"
    const code = btoa(sessionInfo.refresh_token);
    const url = new URL(redirectUri);
    if (state) url.searchParams.append("state", state);
    url.searchParams.append("code", code);

    window.location.href = url.toString();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      setSessionInfo(data.session);
    }
    setLoading(false);
  };

  if (!redirectUri || !state) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl text-red-400 mb-4">Parâmetros Inválidos</h1>
        <p className="text-gray-400 text-center">
          Esta página deve ser acessada apenas pelo aplicativo da Alexa durante o Account Linking.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1c1c1c] p-8 rounded-2xl border border-gray-800 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Vincular Alexa</h1>
          <p className="text-gray-400 text-sm">
            Conecte a Alexa à sua conta do Gaga List para poder adicionar itens por voz.
          </p>
        </div>

        {sessionInfo ? (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-center w-full">
              Você está logado como <br />
              <strong className="text-white">{sessionInfo.user.email}</strong>
            </div>
            <button
              onClick={handleLink}
              className="w-full bg-[#53E076] text-black font-semibold py-3 rounded-xl hover:bg-[#45c761] transition-colors"
            >
              Autorizar Alexa
            </button>
            <button
              onClick={() => supabase.auth.signOut().then(() => setSessionInfo(null))}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Entrar com outra conta
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm text-gray-400 ml-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#131313] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#53E076] transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1 mb-2">
              <label className="text-sm text-gray-400 ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#131313] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#53E076] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#53E076] text-black font-semibold py-3 rounded-xl hover:bg-[#45c761] transition-colors disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar e Vincular"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AlexaLinkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">Carregando...</div>}>
      <AlexaLinkContent />
    </Suspense>
  );
}
