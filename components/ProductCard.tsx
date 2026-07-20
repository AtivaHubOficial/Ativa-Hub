import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Star, Truck } from "lucide-react";
import { money } from "@/lib/data";
import { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex w-full flex-col">
        <Link href={`/produto/${product.id}`} className="relative block h-60 bg-white">
          <Image src={product.imageUrl} alt={product.title} fill className="object-contain p-5" />
          {discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">
              {discount}% OFF
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-amber-500">
            <Star size={16} fill="currentColor" /> {product.rating.toFixed(1)}
            <span className="font-normal text-slate-500">({product.reviewCount.toLocaleString("pt-BR")})</span>
          </div>

          <Link href={`/produto/${product.id}`} className="line-clamp-2 font-bold text-slate-900 hover:underline">
            {product.title}
          </Link>

          <div className="mt-3">
            {product.oldPrice && <div className="text-sm text-slate-400 line-through">{money(product.oldPrice)}</div>}
            <div className="text-3xl font-black text-slate-900">{money(product.price)}</div>
            <div className="text-sm text-green-700">{product.installmentText}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            {product.freeShipping && <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700"><Truck size={14}/> Frete grátis</span>}
            {product.fullShipping && <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700"><BadgeCheck size={14}/> Envio Full</span>}
          </div>

          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="mt-5 block rounded-xl bg-green-600 px-4 py-3 text-center font-black text-white hover:bg-green-700"
          >
            Comprar no site parceiro
          </a>
        </div>
      </div>
    </article>
  );
}
