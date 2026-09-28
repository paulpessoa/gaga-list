"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
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
  const [paramsValid, setParamsValid] = useState<boolean | null>(null);

  // Cliente SEM persistência: cada vínculo gera uma sessão só da Alexa.
  // Se reaproveitasse a sessão do navegador, a rotação de refresh token do
  // Supabase derrubaria um dos dois lados (web ou Alexa).
  const supabase = useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }),
    []
  );

  const missingParams = !redirectUri || !state || !clientId;

  useEffect(() => {
    if (!redirectUri || !state || !clientId) return;
    const qs = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
    fetch(`/api/alexa/authorize?${qs}`)
      .then((res) => setParamsValid(res.ok))
      .catch(() => setParamsValid(false));
  }, [redirectUri, state, clientId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.session) {
      setError(loginError?.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : loginError?.message || "Falha no login.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/alexa/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        refresh_token: data.session.refresh_token,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.redirect) {
      setError("Não foi possível autorizar a Alexa. Tente novamente pelo app da Alexa.");
      setLoading(false);
      return;
    }

    window.location.href = json.redirect;
  };

  if (!missingParams && paramsValid === null) {
    return <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">Carregando...</div>;
  }

  if (missingParams || !paramsValid) {
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
            Entre com sua conta do Gaga List para usar suas listas por voz.
          </p>
        </div>

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
              autoComplete="email"
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
              autoComplete="current-password"
              className="w-full bg-[#131313] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#53E076] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#53E076] text-black font-semibold py-3 rounded-xl hover:bg-[#45c761] transition-colors disabled:opacity-50"
          >
            {loading ? "Vinculando..." : "Entrar e Vincular"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-center gap-4 text-xs text-gray-500">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#53E076] transition-colors">
            Privacidade
          </a>
          <span>•</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[#53E076] transition-colors">
            Termos de Uso
          </a>
        </div>
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
