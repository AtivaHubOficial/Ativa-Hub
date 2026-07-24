"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { listCategories, listProducts } from "@/lib/product-repository";
import { getPublicPlatformSettings } from "@/lib/platform-settings-repository";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/platform-settings";
import type { Product } from "@/types/product";
import type { PlatformSettings } from "@/types/platform-settings";
import { ArrowRight, ShieldCheck, Sparkles, Tractor } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  useEffect(() => {
    getPublicPlatformSettings()
      .then((loaded) => {
        setSettings(loaded);
        return listProducts(loaded.showInactiveProducts).then((items) => ({ loaded, items }));
      })
      .then(({ loaded, items }) => {
        setProducts(items);
        setCategory(loaded.defaultCategory === "Todos" || items.some((item) => item.category === loaded.defaultCategory) ? loaded.defaultCategory : "Todos");
      });
    listCategories().then((items) => setCategories(["Todos", ...items]));
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return products
      .filter((product) =>
        (settings.showProductsWithoutImage || Boolean(product.imageUrl)) &&
        (category === "Todos" || product.category === category) &&
        `${product.title} ${product.brand} ${product.category} ${product.tags.join(" ")}`.toLowerCase().includes(query),
      )
      .slice(0, settings.productsPerPage);
  }, [products, category, search, settings]);

  return (
    <>
      <Header search={search} onSearch={setSearch} settings={settings} />
      <main>
        <section className="mx-auto mt-7 max-w-7xl px-5">
          <div className="overflow-hidden rounded-3xl bg-slate-900 bg-cover bg-center px-7 py-12 text-white md:px-12" style={settings.coverImageUrl ? { backgroundImage: `linear-gradient(#0f172acc,#0f172acc),url("${settings.coverImageUrl}")` } : undefined}>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold"><Sparkles size={16} style={{ color: settings.accentColor }} /> Seleção {settings.platformName}</span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{settings.heroTitle}</h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-300">{settings.heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#produtos" className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-slate-900" style={{ backgroundColor: settings.accentColor }}>{settings.primaryButtonText} <ArrowRight size={18} /></a>
                <span className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold"><ShieldCheck size={18} /> {settings.partnerNotice}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto mt-5 flex max-w-7xl gap-3 overflow-x-auto px-5 pb-2">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 font-bold ${category === item ? "border-transparent" : "border-slate-200 bg-white"}`} style={category === item ? { backgroundColor: settings.accentColor } : undefined}>{item === "Agro" && <Tractor size={16} className="mr-1 inline" />}{item}</button>)}
        </section>
        <section id="produtos" className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-5 flex items-end justify-between"><div><p className="font-bold text-green-700">Ofertas selecionadas</p><h2 className="text-3xl font-black">Produtos em destaque</h2></div><span className="text-sm text-slate-500">{filtered.length} produto(s)</span></div>
          {filtered.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} showEmptyRatings={settings.showEmptyRatings} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500">Nenhum produto encontrado.</div>}
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">{settings.partnerNotice}</footer>
    </>
  );
}
