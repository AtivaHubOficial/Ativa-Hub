"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Star, Truck } from "lucide-react";
import { loadProducts } from "@/lib/storage";
import { money } from "@/lib/data";
import { Product } from "@/types/product";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    setProduct(loadProducts().find((p) => p.id === params.id) ?? null);
  }, [params.id]);

  if (!product) return <div className="p-10 text-center">Produto não encontrado.</div>;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600">
        <ArrowLeft size={18} /> Voltar para a loja
      </Link>

      <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-card md:grid-cols-2 md:p-9">
        <div className="relative min-h-[430px]">
          <Image src={product.imageUrl} alt={product.title} fill className="object-contain" />
        </div>

        <div>
          <div className="text-sm font-bold text-slate-500">{product.brand} · {product.category}</div>
          <h1 className="mt-2 text-3xl font-black">{product.title}</h1>

          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-amber-500"><Star fill="currentColor" size={18}/>{product.rating}</span>
            <span className="text-slate-500">{product.reviewCount.toLocaleString("pt-BR")} avaliações</span>
          </div>

          <div className="mt-6">
            {product.oldPrice && <div className="text-slate-400 line-through">{money(product.oldPrice)}</div>}
            <div className="text-5xl font-black">{money(product.price)}</div>
            <div className="mt-1 text-green-700">{product.installmentText}</div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
            {product.freeShipping && <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-700"><Truck size={17}/>Frete grátis</span>}
            {product.fullShipping && <span className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700"><BadgeCheck size={17}/>Envio Full</span>}
          </div>

          <p className="mt-6 leading-7 text-slate-600">{product.description}</p>

          <ul className="mt-5 space-y-2">
            {product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
          </ul>

          <a href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener"
             className="mt-8 block rounded-xl bg-green-600 px-5 py-4 text-center text-lg font-black text-white hover:bg-green-700">
            Comprar no Mercado Livre
          </a>
          <p className="mt-3 text-center text-xs text-slate-500">
            Você será direcionado ao site parceiro para concluir a compra.
          </p>
        </div>
      </div>
    </main>
  );
}
