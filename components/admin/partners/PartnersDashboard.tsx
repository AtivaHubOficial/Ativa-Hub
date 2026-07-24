"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, ExternalLink, RefreshCw } from "lucide-react";
import type { PartnerOverview, PartnerStatus } from "@/types/partner";
import type { MercadoLivreDiagnosticResult } from "@/lib/mercado-livre-diagnostics";

const statusStyle: Record<PartnerStatus, string> = {
  "Conectado": "bg-blue-100 text-blue-700",
  "Funcionando": "bg-emerald-100 text-emerald-700",
  "Atenção necessária": "bg-amber-100 text-amber-800",
  "Não configurado": "bg-slate-100 text-slate-600",
  "Em desenvolvimento": "bg-violet-100 text-violet-700",
  "Desativado": "bg-red-100 text-red-700",
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "Sem registro";

export default function PartnersDashboard() {
  const [partners, setPartners] = useState<PartnerOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diagnostics, setDiagnostics] = useState<{ checkedAt: string; userId: string | null; itemId: string | null; results: MercadoLivreDiagnosticResult[] } | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/partners", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { partners?: PartnerOverview[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Erro ao carregar parceiros.");
        setPartners(body.partners ?? []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Erro ao carregar parceiros."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  async function disconnect() {
    setError("");
    const response = await fetch("/api/auth/mercado-livre/disconnect", { method: "DELETE" });
    if (!response.ok) { setError("Não foi possível desconectar a conta do Mercado Livre."); return; }
    load();
  }
  async function diagnose() {
    setDiagnosing(true); setError("");
    try {
      const response = await fetch("/api/admin/partners/mercado-livre/diagnostics", { cache: "no-store" });
      const body = await response.json() as { checkedAt?: string; userId?: string | null; itemId?: string | null; results?: MercadoLivreDiagnosticResult[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível executar o diagnóstico.");
      setDiagnostics({ checkedAt: body.checkedAt ?? new Date().toISOString(), userId: body.userId ?? null, itemId: body.itemId ?? null, results: body.results ?? [] });
      load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível executar o diagnóstico."); }
    finally { setDiagnosing(false); }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Integrações</p><h1 className="mt-1 text-3xl font-black">Parceiros</h1><p className="mt-2 text-slate-600">Acompanhe conexões reais e integrações planejadas da Ativa Hub.</p></div><button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 font-bold disabled:opacity-50"><RefreshCw size={17} />Atualizar diagnóstico</button></header>
      {loading ? <p>Carregando parceiros…</p> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><p className="font-bold">{error}</p><button onClick={load} className="mt-2 text-sm font-bold underline">Tentar novamente</button></div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => (
            <article key={partner.key} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><span className="text-xs font-black uppercase tracking-wider text-slate-400">{partner.availability}</span><h2 className="mt-1 text-xl font-black">{partner.name}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[partner.status]}`}>{partner.status}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><Boxes size={17} className="text-slate-500" /><strong className="mt-2 block text-2xl">{partner.importedProducts}</strong><span className="text-xs text-slate-500">Importados</span></div><div className="rounded-xl bg-slate-50 p-3"><Boxes size={17} className="text-emerald-600" /><strong className="mt-2 block text-2xl">{partner.activeProducts}</strong><span className="text-xs text-slate-500">Ativos</span></div></div>
              <dl className="mt-4 space-y-2 text-sm"><div><dt className="font-bold">Última importação</dt><dd className="text-slate-500">{formatDate(partner.lastImport)}</dd></div><div><dt className="font-bold">Última sincronização</dt><dd className="text-slate-500">{formatDate(partner.lastSync)}</dd></div>{partner.accountId?<div><dt className="font-bold">Conta conectada</dt><dd className="text-slate-500">Usuário {partner.accountId}</dd></div>:null}{partner.connectionExpiresAt?<div><dt className="font-bold">Token atual expira</dt><dd className="text-slate-500">{formatDate(partner.connectionExpiresAt)}</dd></div>:null}</dl>
              <p className="mt-4 flex-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{partner.diagnostic}</p>
              {partner.actions.length ? <div className="mt-4 flex flex-wrap gap-2">{partner.actions.map((action) => <Link key={action.href} href={action.href} className="inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 text-sm font-bold">{action.label}<ExternalLink size={14} /></Link>)}{partner.key==="mercado_livre"?<button onClick={diagnose} disabled={diagnosing} className="min-h-10 rounded-xl border border-blue-200 px-3 text-sm font-bold text-blue-700 disabled:opacity-50">{diagnosing?"Diagnosticando…":"Executar diagnóstico oficial"}</button>:null}{partner.key==="mercado_livre"&&partner.accountId?<><Link href="/api/auth/mercado-livre/start" className="inline-flex min-h-10 items-center rounded-xl border px-3 text-sm font-bold">Renovar conexão</Link><button onClick={disconnect} className="min-h-10 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700">Desconectar</button></>:null}</div> : <p className="mt-4 text-sm font-bold text-slate-400">Nenhuma ação disponível.</p>}
            </article>
          ))}
        </div>
      )}
      {diagnostics?<section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Diagnóstico oficial do Mercado Livre</h2><p className="mt-1 text-sm text-slate-500">Executado em {formatDate(diagnostics.checkedAt)}{diagnostics.userId?` · USER_ID: ${diagnostics.userId}`:""}{diagnostics.itemId?` · Item testado: ${diagnostics.itemId}`:""}</p></div></div><div className="mt-4 grid gap-3">{diagnostics.results.map((result)=><article key={result.endpoint} className="grid gap-2 rounded-xl border p-4 md:grid-cols-[auto_1fr_auto] md:items-center"><span className="text-xl" aria-label={result.tone==="ok"?"OK":result.tone==="warning"?"Warning":"Erro"}>{result.tone==="ok"?"🟢":result.tone==="warning"?"🟡":"🔴"}</span><div><code className="break-all text-sm font-bold">{result.endpoint}</code><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{result.message}</p><p className="mt-1 text-xs text-slate-400">Código: {result.code}</p></div><div className="text-right text-sm"><b>{result.status??"Sem resposta"}</b><span className="block text-slate-500">{result.durationMs} ms</span></div></article>)}</div></section>:null}
    </main>
  );
}
