"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/data";
import { loadProducts } from "@/lib/storage";
import { Product } from "@/types/product";
import { ArrowRight, ShieldCheck, Sparkles, Tractor } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => setProducts(loadProducts().filter((p) => p.status === "active")), []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((p) =>
      (category === "Todos" || p.category === category) &&
      `${p.title} ${p.brand} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(query)
    );
  }, [products, category, search]);

  return (
    <>
      <Header search={search} onSearch={setSearch} />

      <main>
        <section className="mx-auto mt-7 max-w-7xl px-5">
          <div className="overflow-hidden rounded-3xl bg-slate-900 px-7 py-12 text-white md:px-12">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
                <Sparkles size={16} className="text-ativa-yellow" /> Seleção Ativa Hub
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Ofertas úteis para quem vive o campo e a cidade.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-300">
                Produtos selecionados com foco em agro, ferramentas, tecnologia e rotina profissional.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#produtos" className="flex items-center gap-2 rounded-xl bg-ativa-yellow px-5 py-3 font-black text-slate-900">
                  Ver ofertas <ArrowRight size={18} />
                </a>
                <span className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold">
                  <ShieldCheck size={18} /> Compra finalizada no parceiro
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-5 flex max-w-7xl gap-3 overflow-x-auto px-5 pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 font-bold ${
                category === item ? "border-ativa-yellow bg-ativa-yellow" : "border-slate-200 bg-white"
              }`}
            >
              {item === "Agro" && <Tractor size={16} className="mr-1 inline" />}
              {item}
            </button>
          ))}
        </section>

        <section id="produtos" className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="font-bold text-green-700">Ofertas selecionadas</p>
              <h2 className="text-3xl font-black">Produtos em destaque</h2>
            </div>
            <span className="text-sm text-slate-500">{filtered.length} produto(s)</span>
          </div>

          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500">
              Nenhum produto encontrado.
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
        A Ativa Hub é uma vitrine independente. Preços, estoque, frete e condições são confirmados no site parceiro.
        Alguns links podem gerar comissão sem custo adicional para o comprador.
      </footer>
    </>
  );
}
