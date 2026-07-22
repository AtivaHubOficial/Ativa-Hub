import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BadgeCheck, ExternalLink, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductActions from "@/components/product/ProductActions";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductDescription from "@/components/product/ProductDescription";
import ProductGallery from "@/components/product/ProductGallery";
import ProductRatingSummary from "@/components/product/ProductRatingSummary";
import { money } from "@/lib/data";
import { getProductPageData } from "@/lib/product-server";

type PageProps = { params: Promise<{ id: string }> };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const validImage = (url: string) => /^https?:\/\//i.test(url);
const summary = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 160);
async function getBaseUrl() {
  if (siteUrl) return siteUrl;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!host || !/^[a-z0-9.:[\]-]+$/i.test(host)) return undefined;
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params; const { product } = await getProductPageData(id);
  if (!product) return { title: "Produto não encontrado | Ativa Hub", robots: { index: false, follow: false } };
  const description = summary(product.shortDescription || product.description || `${product.title} na Ativa Hub.`);
  const path = `/produto/${product.slug || product.id}`; const baseUrl = await getBaseUrl(); const canonical = baseUrl ? `${baseUrl}${path}` : undefined;
  const image = [product.imageUrl, ...product.gallery].find(validImage);
  return { title: `${product.title} | Ativa Hub`, description, alternates: canonical ? { canonical } : undefined, openGraph: { type: "website", title: product.title, description, url: canonical, images: image ? [{ url: image, alt: product.title }] : undefined }, twitter: { card: image ? "summary_large_image" : "summary", title: product.title, description, images: image ? [image] : undefined } };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params; const { product, related } = await getProductPageData(id);
  if (!product || product.status !== "active") notFound();
  const productPath = `/produto/${product.slug || product.id}`; const baseUrl = await getBaseUrl(); const pageUrl = baseUrl ? `${baseUrl}${productPath}` : productPath;
  const imageList = Array.from(new Set([product.imageUrl, ...product.gallery].filter(validImage)));
  const productJsonLd: Record<string, unknown> = { "@context": "https://schema.org", "@type": "Product", name: product.title, description: summary(product.shortDescription || product.description), category: product.category, image: imageList.length ? imageList : undefined, url: pageUrl, offers: { "@type": "Offer", price: product.price.toFixed(2), priceCurrency: "BRL", url: product.affiliateUrl || pageUrl } };
  if (product.brand) productJsonLd.brand = { "@type": "Brand", name: product.brand };
  if (product.reviewCount > 0 && product.rating > 0) productJsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount };
  const breadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: baseUrl ? `${baseUrl}/` : "/" }, ...(product.category ? [{ "@type": "ListItem", position: 2, name: product.category }] : []), { "@type": "ListItem", position: product.category ? 3 : 2, name: product.title, item: pageUrl }] };
  const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(productJsonLd) }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbJsonLd) }}/><ProductBreadcrumb category={product.category} title={product.title}/>
    <article className="grid gap-8 rounded-3xl bg-white p-5 shadow-card md:grid-cols-2 md:p-8 lg:gap-12"><ProductGallery title={product.title} imageUrl={product.imageUrl} gallery={product.gallery}/><div className="min-w-0"><p className="text-sm font-bold text-slate-500">{[product.brand, product.category].filter(Boolean).join(" · ")}</p><h1 className="mt-2 break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{product.title}</h1><ProductRatingSummary rating={product.rating} reviewCount={product.reviewCount}/><div className="mt-6">{product.oldPrice && <div className="text-slate-400 line-through">{money(product.oldPrice)}</div>}<div className="text-4xl font-black text-slate-950 sm:text-5xl">{money(product.price)}</div>{product.installmentText && <div className="mt-1 text-green-700">{product.installmentText}</div>}</div><div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">{product.freeShipping && <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-700"><Truck size={17} aria-hidden="true"/>Frete grátis</span>}{product.fullShipping && <span className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700"><BadgeCheck size={17} aria-hidden="true"/>Envio Full</span>}</div>{product.shortDescription && <p className="mt-6 leading-7 text-slate-600">{product.shortDescription}</p>}{product.affiliateUrl && <Link href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener" className="mt-8 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 text-center text-lg font-black text-white hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300">Comprar no Mercado Livre <ExternalLink size={19} aria-hidden="true"/></Link>}<p className="mt-3 text-center text-xs text-slate-500">Você será direcionado ao site parceiro. Preço e disponibilidade são confirmados no destino.</p><ProductActions id={product.id} title={product.title}/></div></article>
    <ProductDescription product={product}/><section className="mt-10" aria-labelledby="related-title"><div className="mb-5"><p className="text-sm font-bold uppercase tracking-wider text-green-700">Continue explorando</p><h2 id="related-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Produtos relacionados</h2></div>{related.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Nenhum outro produto ativo disponível no momento.</p>}</section>
  </main>;
}
