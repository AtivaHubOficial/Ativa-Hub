"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search, X } from "lucide-react";
import ProductImage from "@/components/product/ProductImage";
import type {
  LogzzImportCandidate,
  LogzzProductRole,
} from "@/lib/connectors/logzz/types";
import {
  requiresLogzzImportConfirmation,
  toggleVisibleSelection,
} from "./logzz-selection";

const roleLabel: Record<LogzzProductRole, string> = {
  affiliate: "Afiliado",
  producer: "Produtor",
  coproducer: "Coprodutor",
};
type Summary = {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

export default function LogzzImporter() {
  const [products, setProducts] = useState<LogzzImportCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<LogzzProductRole | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          (role === "all" || product.role === role) &&
          (!search.trim() ||
            [product.name, product.offerName].some((value) =>
              value.toLowerCase().includes(search.trim().toLowerCase()),
            )),
      ),
    [products, role, search],
  );
  const visibleIds = visible
    .filter((product) => product.importable)
    .map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  async function load() {
    setLoading(true);
    setMessage("Carregando produtos...");
    setSummary(null);
    try {
      const response = await fetch("/api/admin/integrations/logzz/products", {
        cache: "no-store",
      });
      const body = await response.json() as {
        products?: LogzzImportCandidate[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error);
      setProducts(body.products ?? []);
      setSelected(new Set());
      setMessage(body.products?.length ? "" : "Nenhum produto encontrado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a Logzz.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runImport() {
    setConfirming(false);
    setImporting(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/integrations/logzz/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const body = await response.json() as Summary & { error?: string };
      if (!response.ok) throw new Error(body.error);
      setSummary(body);
      setMessage(
        body.failed
          ? "Alguns produtos não puderam ser importados."
          : body.updated && !body.created
            ? "Produtos atualizados."
            : "Produtos importados.",
      );
      setSelected(new Set());
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Alguns produtos não puderam ser importados.",
      );
    } finally {
      setImporting(false);
    }
  }

  function requestImport() {
    if (requiresLogzzImportConfirmation(selected.size)) {
      setConfirming(true);
      return;
    }
    void runImport();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <Link href="/admin/produtos" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <ArrowLeft size={17} />Voltar aos produtos
        </Link>
        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-600">Integrações</p>
        <h1 className="mt-1 text-3xl font-black">Importar da Logzz</h1>
        <p className="mt-2 text-slate-600">Carregue o catálogo, filtre e escolha somente as ofertas que deseja salvar.</p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white disabled:opacity-50">
          <Download size={18} />{loading ? "Carregando produtos..." : "Carregar produtos da Logzz"}
        </button>
        {products.length ? (
          <>
            <button onClick={requestImport} disabled={importing || !selected.size} className="min-h-11 rounded-xl bg-amber-400 px-4 font-black text-slate-950 disabled:opacity-50">
              {importing ? "Importando..." : `Importar selecionados (${selected.size})`}
            </button>
            <button onClick={() => setSelected(new Set())} disabled={!selected.size || importing} className="min-h-11 rounded-xl border px-4 font-bold disabled:opacity-50">
              Limpar seleção
            </button>
            <strong aria-live="polite" className="text-sm text-slate-700">
              {selected.size} {selected.size === 1 ? "oferta selecionada" : "ofertas selecionadas"}
            </strong>
          </>
        ) : null}
      </section>

      {message ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 font-bold">{message}</p> : null}
      {summary ? <p className="text-sm text-slate-600">Criados: {summary.created} · Atualizados: {summary.updated} · Falhas: {summary.failed}</p> : null}

      {products.length ? (
        <>
          <section className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]">
            <label className="flex min-h-11 items-center rounded-xl border bg-slate-50 px-3">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto ou oferta" className="w-full bg-transparent px-3 outline-none" />
            </label>
            <select value={role} onChange={(event) => setRole(event.target.value as LogzzProductRole | "all")} className="min-h-11 rounded-xl border px-3">
              <option value="all">Todos os vínculos</option>
              <option value="affiliate">Afiliado</option>
              <option value="producer">Produtor</option>
              <option value="coproducer">Coprodutor</option>
            </select>
            <button onClick={() => setSelected((current) => toggleVisibleSelection(current, visibleIds))} className="min-h-11 rounded-xl border px-4 font-bold">
              {allVisibleSelected ? "Desmarcar visíveis" : "Selecionar visíveis"}
            </button>
          </section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((product) => (
              <article key={product.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${!product.importable ? "opacity-70" : ""}`}>
                <div className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <ProductImage src={product.imageUrl} alt={product.name || "Produto Logzz"} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase text-amber-700">{roleLabel[product.role]}</span>
                    <h2 className="line-clamp-2 font-black">Produto: {product.name || "Sem nome"}</h2>
                    <p className="text-sm text-slate-500">Oferta: {product.offerName || "Sem nome"}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-1 text-sm">
                  <div><dt className="inline font-bold">Categoria: </dt><dd className="inline">{product.category || "Sem categoria"}</dd></div>
                  <div><dt className="inline font-bold">Preço: </dt><dd className="inline">{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd></div>
                  <div><dt className="inline font-bold">Checkout: </dt><dd className={`inline font-bold ${product.importable ? "text-emerald-700" : "text-red-600"}`}>{product.importable ? "Disponível" : "Indisponível"}</dd></div>
                </dl>
                <label className="mt-4 flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={selected.has(product.id)} disabled={!product.importable} onChange={() => toggle(product.id)} />Selecionar
                </label>
              </article>
            ))}
          </div>
          {!visible.length ? <p>Nenhum produto encontrado.</p> : null}
        </>
      ) : null}

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="logzz-confirm-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="logzz-confirm-title" className="text-xl font-black">Confirmar importação em massa</h2>
              <button onClick={() => setConfirming(false)} aria-label="Fechar" className="rounded-lg p-1"><X /></button>
            </div>
            <p className="mt-4">Você está prestes a importar <strong>{selected.size} ofertas da Logzz</strong>.</p>
            <p className="mt-2 text-slate-600">Essa operação poderá criar ou atualizar muitos produtos. Deseja continuar?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border px-4 font-bold">Cancelar</button>
              <button onClick={() => void runImport()} className="min-h-11 rounded-xl bg-amber-400 px-4 font-black text-slate-950">
                Confirmar importação de {selected.size} ofertas
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
