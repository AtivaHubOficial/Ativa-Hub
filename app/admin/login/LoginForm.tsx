"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    if (!email.trim() || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("O Supabase não está configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local e reinicie o servidor.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message === "Invalid login credentials" ? "E-mail ou senha inválidos." : `Não foi possível entrar: ${authError.message}`);
        return;
      }

      const requested = new URLSearchParams(window.location.search).get("proximo");
      const destination = requested?.startsWith("/admin") && !requested.startsWith("//")
        ? requested
        : "/admin";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao Supabase. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
      <label className="block text-sm font-bold text-slate-700">E-mail<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"/></label>
      <label className="block text-sm font-bold text-slate-700">Senha<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"/></label>
      {error ? <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={19}/> : <LockKeyhole size={19}/>} {loading ? "Entrando…" : "Entrar no Admin"}</button>
    </form>
  );
}
