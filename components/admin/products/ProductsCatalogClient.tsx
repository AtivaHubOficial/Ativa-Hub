"use client";
import { useCallback, useEffect, useState } from "react";
import { CopyCheck, Download, Plus } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import EmptyProductsState from "./EmptyProductsState";
import ProductsList from "./ProductsList";
import ProductsToolbar from "./ProductsToolbar";
import type { FeaturedFilter, SourceFilter, StatusFilter } from "./product-filters";
import { listAdminCategories } from "@/lib/category-repository";
import { deselectVisibleProducts, selectVisibleProducts, toggleProductSelection } from "@/lib/product-selection";

type ProductResponse = { products?: Product[]; total?: number; error?: string };
type DeleteMode = "selected" | "source" | "all";

export default function ProductsCatalogClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryId, setCategoryId] = useState("");
  const [deleteMode, setDeleteMode] = useState<DeleteMode | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const pageSize = 24;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, category, status, featured, source });
    try {
      const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
      const body = await response.json() as ProductResponse;
      if (!response.ok) throw new Error(body.error ?? "Erro ao carregar produtos.");
      setProducts(body.products ?? []); setTotal(body.total ?? 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao carregar produtos."); }
    finally { setLoading(false); }
  }, [page, search, category, status, featured, source]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("origem");
    if (requested === "logzz" || requested === "mercado_livre" || requested === "manual") setSource(requested);
    listAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };
  const clear = () => { setSearch(""); setCategory("all"); setStatus("all"); setFeatured("all"); setSource("all"); setPage(1); };
  const visibleIds = products.map((product) => product.id);
  const request = async (method: "POST" | "DELETE", body: Record<string, unknown>) => {
    setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/admin/products/batch", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { updated?: number; deleted?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a ação.");
      setFeedback(method === "DELETE" ? `${result.deleted ?? 0} produto(s) excluído(s).` : `${result.updated ?? 0} produto(s) atualizado(s).`);
      setSelected(new Set()); setDeleteMode(null); setConfirmation(""); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  };
  const update = (action: "activate" | "deactivate" | "category") => request("POST", { action, ids: [...selected], categoryId });
  const confirmDelete = () => request("DELETE", deleteMode === "selected"
    ? { mode: "ids", ids: [...selected], confirmation: "EXCLUIR SELECIONADOS" }
    : deleteMode === "source"
      ? { mode: "source", source, confirmation }
      : { mode: "all", confirmation });
  const requiredPhrase = deleteMode === "source" ? "EXCLUIR ORIGEM" : deleteMode === "all" ? "EXCLUIR TODOS" : "";
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Catálogo</p><h1 className="mt-1 text-3xl font-black">Produtos</h1><p className="mt-2 text-slate-600">Gerencie os produtos persistidos no Supabase.</p></div><div className="flex flex-wrap gap-3"><Link href="/admin/produtos/duplicados" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"><CopyCheck size={18}/>Possíveis duplicados</Link><Link href="/admin/produtos/importar-logzz" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"><Download size={18}/>Importar da Logzz</Link><Link href="/admin/produtos/novo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"><Plus size={18}/>Adicionar produto</Link></div></section>
    <section className="rounded-2xl border bg-white p-4 shadow-sm"><ProductsToolbar search={search} category={category} status={status} featured={featured} source={source} categories={categories.map((item)=>item.name)} hasFilters={Boolean(search)||category!=="all"||status!=="all"||featured!=="all"||source!=="all"} onSearchChange={resetPage(setSearch)} onCategoryChange={resetPage(setCategory)} onStatusChange={resetPage(setStatus)} onFeaturedChange={resetPage(setFeatured)} onSourceChange={resetPage(setSource)} onClear={clear}/></section>
    {feedback ? <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{feedback}</p> : null}
    <section className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-4 text-sm shadow-sm">
      <b>{selected.size} selecionado(s)</b>
      <button onClick={()=>setSelected(selectVisibleProducts(selected,visibleIds))} className="rounded-lg border px-3 py-2 font-bold">Selecionar visíveis</button>
      <button onClick={()=>setSelected(deselectVisibleProducts(selected,visibleIds))} className="rounded-lg border px-3 py-2 font-bold">Desmarcar visíveis</button>
      <button onClick={()=>setSelected(new Set())} className="rounded-lg border px-3 py-2 font-bold">Limpar seleção</button>
      <button disabled={!selected.size||busy} onClick={()=>update("activate")} className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white disabled:opacity-40">Ativar</button>
      <button disabled={!selected.size||busy} onClick={()=>update("deactivate")} className="rounded-lg bg-slate-700 px-3 py-2 font-bold text-white disabled:opacity-40">Desativar</button>
      <select aria-label="Categoria para ação em lote" value={categoryId} onChange={(event)=>setCategoryId(event.target.value)} className="min-h-10 rounded-lg border px-2"><option value="">Alterar categoria…</option>{categories.filter((item)=>item.status==="active").map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button disabled={!selected.size||!categoryId||busy} onClick={()=>update("category")} className="rounded-lg bg-amber-500 px-3 py-2 font-bold disabled:opacity-40">Aplicar categoria</button>
      <button disabled={!selected.size||busy} onClick={()=>setDeleteMode("selected")} className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-700 disabled:opacity-40">Excluir selecionados</button>
    </section>
    {loading ? <p>Carregando produtos…</p> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5"><p>{error}</p><button onClick={load} className="mt-3 font-bold">Tentar novamente</button></div> : <><div className="flex justify-between text-sm"><b>{products.length} nesta página</b><span>{total} resultado(s)</span></div>{products.length?<ProductsList products={products} selected={selected} onToggle={(id)=>setSelected(toggleProductSelection(selected,id))} onDelete={(product)=>{setSelected(new Set([product.id]));setDeleteMode("selected")}}/>:<EmptyProductsState onClear={clear}/>}<nav aria-label="Paginação" className="flex items-center justify-center gap-3"><button disabled={page<=1} onClick={()=>setPage(page-1)} className="rounded-lg border px-4 py-2 font-bold disabled:opacity-40">Anterior</button><span>Página {page} de {pages}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)} className="rounded-lg border px-4 py-2 font-bold disabled:opacity-40">Próxima</button></nav></>}
    <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-5"><h2 className="text-lg font-black text-red-800">Área de perigo</h2><p className="mt-1 text-sm text-red-700">Estas ações excluem somente registros da tabela de produtos.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={source==="all"} onClick={()=>setDeleteMode("source")} className="rounded-xl border border-red-300 bg-white px-4 py-2 font-bold text-red-700 disabled:opacity-40">Excluir origem filtrada ({source})</button><button onClick={()=>setDeleteMode("all")} className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Excluir todos os produtos ({total})</button></div></section>
    {deleteMode ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black">Confirmar exclusão</h2><p className="mt-2 text-slate-600">{deleteMode==="selected"?`Excluir ${selected.size} produto(s) selecionado(s)?`:`Digite ${requiredPhrase} para confirmar.`}</p>{requiredPhrase?<input autoFocus value={confirmation} onChange={(event)=>setConfirmation(event.target.value)} className="mt-4 w-full rounded-xl border p-3" aria-label="Frase de confirmação"/>:null}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={()=>{setDeleteMode(null);setConfirmation("")}} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button disabled={busy||Boolean(requiredPhrase&&confirmation!==requiredPhrase)} onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-40">{busy?"Excluindo…":"Confirmar exclusão"}</button></div></section></div>:null}
  </main>;
}
