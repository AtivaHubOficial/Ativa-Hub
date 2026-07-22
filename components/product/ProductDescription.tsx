import { parseProductDescription } from "@/lib/product-description";
import type { Product } from "@/types/product";
export default function ProductDescription({ product }: { product: Product }) {
  const sections = parseProductDescription(product.description);
  const hasDetails = sections.length || product.features.length || product.specifications?.length;
  if (!hasDetails) return null;
  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="product-description-title"><h2 id="product-description-title" className="text-2xl font-black text-slate-950">Descrição do produto</h2><div className="mt-6 grid gap-8 lg:grid-cols-2">
    {sections.map((section, index) => <section key={`${section.title}-${index}`} className={section.title === "Descrição" ? "lg:col-span-2" : ""}><h3 className="text-lg font-black text-slate-900">{section.title}</h3><div className="mt-3 space-y-3 text-base leading-7 text-slate-600">{section.paragraphs.map((paragraph, item) => <p key={item}>{paragraph}</p>)}{section.items.length > 0 && <ul className="list-disc space-y-2 pl-5">{section.items.map((value, item) => <li key={item}>{value}</li>)}</ul>}{section.entries.length > 0 && <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">{section.entries.map(([name, value], item) => <div key={item} className="grid gap-1 p-3 sm:grid-cols-2"><dt className="font-bold text-slate-800">{name}</dt><dd>{value}</dd></div>)}</dl>}</div></section>)}
    {product.features.length > 0 && <section><h3 className="text-lg font-black text-slate-900">Características</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>}
    {Boolean(product.specifications?.length) && <section><h3 className="text-lg font-black text-slate-900">Especificações técnicas</h3><dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">{product.specifications?.map((entry) => <div key={`${entry.name}-${entry.value}`} className="grid gap-1 p-3 sm:grid-cols-2"><dt className="font-bold text-slate-800">{entry.name}</dt><dd className="text-slate-600">{entry.value}</dd></div>)}</dl></section>}
  </div></section>;
}
