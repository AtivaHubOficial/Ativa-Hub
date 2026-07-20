"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3, Bot, CheckCircle2, ClipboardCopy, Database,
  ExternalLink, LayoutDashboard, PackagePlus, Save, Trash2
} from "lucide-react";
import MissionCard from "@/components/MissionCard";
import { loadProducts, saveProducts } from "@/lib/storage";
import { Product } from "@/types/product";
import { money } from "@/lib/data";

const emptyForm = {
  title: "", brand: "", category: "Agro", subcategory: "", price: "",
  oldPrice: "", rating: "4.8", reviewCount: "0", soldCount: "0",
  installmentText: "", imageUrl: "", affiliateUrl: "", description: "",
  features: "", tags: "", freeShipping: true, fullShipping: true
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [generatedPosts, setGeneratedPosts] = useState(0);
  const [publishedPosts, setPublishedPosts] = useState(0);
  const [importUrl, setImportUrl] = useState("");

  useEffect(() => setProducts(loadProducts()), []);

  const metrics = useMemo(() => ({
    active: products.filter((p) => p.status === "active").length,
    clicks: 0,
    sales: 0,
    commission: 0
  }), [products]);

  function update(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function addProduct() {
    if (!form.title || !form.price || !form.imageUrl || !form.affiliateUrl) {
      alert("Preencha título, preço, imagem e link de afiliado.");
      return;
    }

    const product: Product = {
      id: `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
      title: form.title,
      brand: form.brand || "Não informado",
      category: form.category,
      subcategory: form.subcategory,
      price: Number(form.price.replace(",", ".")),
      oldPrice: form.oldPrice ? Number(form.oldPrice.replace(",", ".")) : undefined,
      rating: Number(form.rating.replace(",", ".")),
      reviewCount: Number(form.reviewCount),
      soldCount: Number(form.soldCount),
      fullShipping: form.fullShipping,
      freeShipping: form.freeShipping,
      installmentText: form.installmentText,
      imageUrl: form.imageUrl,
      gallery: [],
      description: form.description,
      features: form.features.split("\n").map((x) => x.trim()).filter(Boolean),
      tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      affiliateUrl: form.affiliateUrl,
      status: "active",
      createdAt: new Date().toISOString()
    };

    const next = [product, ...products];
    setProducts(next);
    saveProducts(next);
    setForm(emptyForm);
  }

  function removeProduct(id: string) {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    saveProducts(next);
  }

  async function generatePost(product: Product) {
    const text = `🔥 OFERTA ATIVA HUB\n\n${product.title}\n⭐ ${product.rating} (${product.reviewCount.toLocaleString("pt-BR")} avaliações)\n💰 ${money(product.price)}\n${product.freeShipping ? "🚚 Frete grátis\n" : ""}${product.installmentText ? `💳 ${product.installmentText}\n` : ""}\nConfira aqui 👇\n${product.affiliateUrl}\n\n#AtivaHub #Ofertas #Achadinhos`;
    await navigator.clipboard.writeText(text);
    setGeneratedPosts((n) => n + 1);
    alert("Post copiado para a área de transferência.");
  }

  function simulateImport() {
    alert("Importação automática preparada na interface. Para ativá-la, conectaremos uma API autorizada no backend. Nesta Sprint, use o cadastro completo abaixo.");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black"><span className="rounded-lg bg-ativa-yellow px-2 py-1">ATIVA</span> HUB</Link>
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-600"><ExternalLink size={18}/>Abrir loja</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-2xl bg-slate-900 p-4 text-white">
          <div className="mb-4 px-3 text-sm font-bold uppercase tracking-wider text-slate-400">Ativa Hub Admin</div>
          {[
            [LayoutDashboard, "Dashboard"],
            [PackagePlus, "Produtos"],
            [Bot, "IA e conteúdo"],
            [BarChart3, "Analytics"],
            [Database, "Banco de dados"]
          ].map(([Icon, label]) => (
            <div key={String(label)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold hover:bg-white/10">
              <Icon size={19}/>{String(label)}
            </div>
          ))}
        </aside>

        <div className="space-y-6">
          <section>
            <p className="font-bold text-green-700">Ativa Hub v2.0</p>
            <h1 className="text-3xl font-black">Dashboard executivo</h1>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Produtos ativos", metrics.active],
              ["Cliques", metrics.clicks],
              ["Vendas", metrics.sales],
              ["Comissões", money(metrics.commission)]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-card">
                <div className="text-sm font-bold text-slate-500">{label}</div>
                <div className="mt-2 text-3xl font-black">{value}</div>
              </div>
            ))}
          </section>

          <MissionCard products={products.length} posts={generatedPosts} published={publishedPosts} />

          <section className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center gap-2"><Bot className="text-purple-600"/><h2 className="text-xl font-black">Importação inteligente</h2></div>
            <p className="mt-2 text-slate-500">Cole um link de produto. A interface está pronta para receber a integração autorizada.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://www.mercadolivre.com.br/..."
                     className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"/>
              <button onClick={simulateImport} className="rounded-xl bg-purple-600 px-5 py-3 font-black text-white">Analisar produto</button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center gap-2"><PackagePlus className="text-green-600"/><h2 className="text-xl font-black">Cadastrar produto</h2></div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Título", "title"], ["Marca", "brand"], ["Categoria", "category"],
                ["Subcategoria", "subcategory"], ["Preço atual", "price"], ["Preço anterior", "oldPrice"],
                ["Avaliação", "rating"], ["Nº de avaliações", "reviewCount"], ["Quantidade vendida", "soldCount"],
                ["Parcelamento", "installmentText"], ["URL da imagem", "imageUrl"], ["Link de afiliado", "affiliateUrl"]
              ].map(([label, name]) => (
                <label key={name} className={name === "title" || name === "imageUrl" || name === "affiliateUrl" ? "md:col-span-2" : ""}>
                  <span className="mb-1 block text-sm font-black">{label}</span>
                  <input value={(form as any)[name]} onChange={(e) => update(name, e.target.value)}
                         className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ativa-yellow"/>
                </label>
              ))}

              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-black">Descrição</span>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"/>
              </label>

              <label>
                <span className="mb-1 block text-sm font-black">Características — uma por linha</span>
                <textarea value={form.features} onChange={(e) => update("features", e.target.value)} rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"/>
              </label>

              <label>
                <span className="mb-1 block text-sm font-black">Tags — separadas por vírgula</span>
                <textarea value={form.tags} onChange={(e) => update("tags", e.target.value)} rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"/>
              </label>

              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={form.freeShipping} onChange={(e) => update("freeShipping", e.target.checked)}/> Frete grátis
              </label>
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={form.fullShipping} onChange={(e) => update("fullShipping", e.target.checked)}/> Envio Full
              </label>
            </div>

            <button onClick={addProduct} className="mt-6 flex items-center gap-2 rounded-xl bg-ativa-yellow px-6 py-3 font-black text-slate-900">
              <Save size={19}/>Salvar produto
            </button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-xl font-black">Produtos cadastrados</h2>
            <div className="mt-4 divide-y">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="font-black">{product.title}</div>
                    <div className="text-sm text-slate-500">{product.category} · {money(product.price)} · ⭐ {product.rating}</div>
                  </div>
                  <button onClick={() => generatePost(product)} className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-bold">
                    <ClipboardCopy size={17}/>Gerar post
                  </button>
                  <button onClick={() => setPublishedPosts((n) => n + 1)} className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-bold text-green-700">
                    <CheckCircle2 size={17}/>Marcar publicado
                  </button>
                  <button onClick={() => removeProduct(product.id)} className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-700">
                    <Trash2 size={17}/>Excluir
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
