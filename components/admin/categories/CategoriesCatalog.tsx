"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listAdminCategories } from "@/lib/category-repository";
import type { Category } from "@/types/category";

export default function CategoriesCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => categories.filter((category) =>
    `${category.name} ${category.slug} ${category.description}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [categories, search]);

  const load = () => {
    setLoading(true);
    setError("");
    listAdminCategories().then(setCategories).catch((reason) =>
      setError(reason instanceof Error ? reason.message : "Erro ao carregar categorias."),
    ).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/categories/${encodeURIComponent(deleting.id)}`, { method: "DELETE" });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Não foi possível excluir a categoria.");
      setDeleting(null);
      setBusy(false);
      return;
    }
    setDeleting(null);
    setBusy(false);
    load();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Catálogo</p><h1 className="mt-1 text-3xl font-black">Categorias</h1><p className="mt-2 text-slate-600">Organize a navegação pública e as classificações dos produtos.</p></div><Link href="/admin/categorias/nova" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white"><Plus size={18} />Nova categoria</Link></header>
      <label className="flex min-h-11 max-w-xl items-center rounded-xl border bg-white px-3 shadow-sm"><Search size={18} className="text-slate-400" /><span className="sr-only">Pesquisar categorias</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar nome, slug ou descrição" className="w-full bg-transparent px-3 outline-none" /></label>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><p className="font-bold">{error}</p><button onClick={load} className="mt-2 text-sm font-bold underline">Tentar novamente</button></div> : null}
      {loading ? <p>Carregando categorias…</p> : filtered.length ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm lg:block"><table className="w-full"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Categoria</th><th>Descrição</th><th>Status</th><th>Produtos</th><th>Ordem</th><th>Criada em</th><th>Ações</th></tr></thead><tbody className="divide-y">{filtered.map((category) => <tr key={category.id}><td className="p-4"><b>{category.name}</b><small className="block text-slate-500">/{category.slug}</small></td><td className="max-w-xs truncate">{category.description || "—"}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${category.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{category.status === "active" ? "Ativa" : "Inativa"}</span></td><td>{category.productCount}</td><td>{category.displayOrder}</td><td>{category.createdAt ? new Date(category.createdAt).toLocaleDateString("pt-BR") : "—"}</td><td><div className="flex gap-2"><Link href={`/admin/categorias/${category.id}/editar`} aria-label={`Editar ${category.name}`} className="rounded-lg border p-2"><Pencil size={16} /></Link><button onClick={() => setDeleting(category)} aria-label={`Excluir ${category.name}`} className="rounded-lg border p-2 text-red-600"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
          <div className="grid gap-4 lg:hidden">{filtered.map((category) => <article key={category.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex justify-between gap-3"><div><h2 className="font-black">{category.name}</h2><p className="text-sm text-slate-500">/{category.slug}</p></div><span className="text-sm font-bold">{category.productCount} produto(s)</span></div><p className="mt-3 text-sm text-slate-600">{category.description || "Sem descrição."}</p><p className="mt-3 text-xs text-slate-500">Ordem {category.displayOrder} · {category.status === "active" ? "Ativa" : "Inativa"}</p><div className="mt-4 flex gap-2"><Link href={`/admin/categorias/${category.id}/editar`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><Pencil size={15} />Editar</Link><button onClick={() => setDeleting(category)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold text-red-600"><Trash2 size={15} />Excluir</button></div></article>)}</div>
        </>
      ) : <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">{search ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}</div>}
      {deleting ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Excluir “{deleting.name}”?</h2>{deleting.productCount ? <p className="mt-3 text-red-700">Esta categoria possui {deleting.productCount} produto(s) vinculado(s) e não pode ser excluída.</p> : <p className="mt-3 text-slate-600">A categoria será removida. Nenhum produto será excluído.</p>}<div className="mt-6 flex justify-end gap-3"><button onClick={() => setDeleting(null)} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button onClick={remove} disabled={busy || deleting.productCount > 0} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-40">{busy ? "Excluindo…" : "Confirmar exclusão"}</button></div></section></div> : null}
    </main>
  );
}
