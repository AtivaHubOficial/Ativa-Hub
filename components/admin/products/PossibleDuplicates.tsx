"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { DuplicateProduct } from "@/lib/catalog-maintenance";

type Group = { products: DuplicateProduct[]; reasons: string[] };
export default function PossibleDuplicates() {
  const [groups,setGroups]=useState<Group[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch("/api/admin/products/duplicates",{cache:"no-store"}).then(async response=>{
    const body=await response.json() as {groups?:Group[];error?:string};
    if(!response.ok)throw new Error(body.error??"Erro ao analisar duplicidades.");
    setGroups(body.groups??[]);
  }).catch(cause=>setError(cause instanceof Error?cause.message:"Erro ao analisar duplicidades.")).finally(()=>setLoading(false))},[]);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6"><div><Link href="/admin/produtos" className="text-sm font-bold text-amber-700">← Voltar aos produtos</Link><h1 className="mt-3 text-3xl font-black">Possíveis duplicados</h1><p className="mt-2 text-slate-600">Comparação conservadora. Nenhum produto é excluído automaticamente.</p></div>
    {loading?<p>Carregando análise…</p>:error?<p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>:groups.length===0?<p className="rounded-xl border bg-white p-6">Nenhum possível duplicado foi encontrado.</p>:groups.map((group,index)=><section key={index} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-black">Grupo {index+1}</h2><p className="mt-1 text-sm text-slate-500">{group.reasons.join(" · ")}</p><div className="mt-4 grid gap-3 md:grid-cols-2">{group.products.map(product=><article key={product.id} className="rounded-xl border p-4"><b>{product.title}</b><p className="mt-1 text-sm text-slate-500">{product.source??"manual"} · R$ {Number(product.price??0).toFixed(2)}</p><Link href={`/admin/produtos/${product.id}/editar`} className="mt-3 inline-block text-sm font-bold text-amber-700">Revisar produto</Link></article>)}</div></section>)}
  </main>;
}
