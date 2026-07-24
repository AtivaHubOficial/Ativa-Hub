"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminCategory } from "@/lib/category-repository";
import { normalizeSlug } from "@/types/product-draft";

const field = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

export default function CategoryForm({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", description: "", status: "active", displayOrder: "0" });
  const [slugEdited, setSlugEdited] = useState(Boolean(categoryId));
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!categoryId) return;
    getAdminCategory(categoryId)
      .then((category) => {
        if (!category) return setMessage("Categoria não encontrada.");
        setForm({
          name: category.name,
          slug: category.slug,
          description: category.description,
          status: category.status,
          displayOrder: String(category.displayOrder),
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Erro ao carregar categoria."))
      .finally(() => setLoading(false));
  }, [categoryId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        categoryId ? `/api/admin/categories/${encodeURIComponent(categoryId)}` : "/api/admin/categories",
        {
          method: categoryId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) }),
        },
      );
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar a categoria.");
      router.push("/admin/categorias");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl p-6">Carregando categoria…</main>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <Link href="/admin/categorias" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={17} />Voltar às categorias</Link>
      <header className="mt-5"><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Catálogo</p><h1 className="mt-1 text-3xl font-black">{categoryId ? "Editar categoria" : "Nova categoria"}</h1></header>
      <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Nome *<input required className={field} value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, ...(!slugEdited ? { slug: normalizeSlug(name) } : {}) })); }} /></label>
          <label className="text-sm font-bold">Slug *<input required className={field} value={form.slug} onChange={(event) => { setSlugEdited(true); setForm((current) => ({ ...current, slug: normalizeSlug(event.target.value) })); }} /></label>
          <label className="text-sm font-bold sm:col-span-2">Descrição<textarea className={`${field} min-h-28 py-3`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <label className="text-sm font-bold">Status<select className={field} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Ativa</option><option value="inactive">Inativa</option></select></label>
          <label className="text-sm font-bold">Ordem de exibição<input type="number" min="0" step="1" required className={field} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} /></label>
        </div>
        {message ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/admin/categorias" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 font-bold">Cancelar</Link><button disabled={pending} className="min-h-11 rounded-xl bg-amber-400 px-5 font-black disabled:opacity-50">{pending ? "Salvando…" : "Salvar categoria"}</button></div>
      </form>
    </main>
  );
}
