"use client";
import { useEffect,useMemo,useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/product";
import EmptyProductsState from "./EmptyProductsState";
import ProductsList from "./ProductsList";
import ProductsToolbar from "./ProductsToolbar";
import { isFeaturedProduct,type FeaturedFilter,type StatusFilter } from "./product-filters";
import { listProducts } from "@/lib/product-repository";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function ProductsCatalogClient(){
 const[products,setProducts]=useState<Product[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const[search,setSearch]=useState("");const[category,setCategory]=useState("all");const[status,setStatus]=useState<StatusFilter>("all");const[featured,setFeatured]=useState<FeaturedFilter>("all");
 const[deleting,setDeleting]=useState<Product|null>(null);const[busy,setBusy]=useState(false);const[feedback,setFeedback]=useState("");
 const load=()=>{setLoading(true);setError("");listProducts(true).then(setProducts).catch(e=>setError(e instanceof Error?e.message:"Erro ao carregar produtos")).finally(()=>setLoading(false))};
 useEffect(load,[]);
 const categories=useMemo(()=>Array.from(new Set(products.map(p=>p.category))).sort((a,b)=>a.localeCompare(b,"pt-BR")),[products]);
 const filtered=useMemo(()=>products.filter(p=>(!search.trim()||[p.title,p.brand,p.category].some(v=>v.toLowerCase().includes(search.trim().toLowerCase())))&&(category==="all"||p.category===category)&&(status==="all"||p.status===status)&&(featured==="all"||(featured==="featured")===isFeaturedProduct(p))),[products,search,category,status,featured]);
 const clear=()=>{setSearch("");setCategory("all");setStatus("all");setFeatured("all")};
 async function remove(){if(!deleting)return;const client=createSupabaseBrowserClient();if(!client)return;setBusy(true);const{error:deleteError}=await client.from("products").delete().eq("id",deleting.id);if(deleteError){setFeedback(deleteError.message);setBusy(false);return}const prefix=`products/${deleting.id}/`;const{data}=await client.storage.from("product-images").list(prefix);if(data?.length)await client.storage.from("product-images").remove(data.map(x=>`${prefix}${x.name}`));setFeedback("Produto excluído com sucesso.");setDeleting(null);setBusy(false);load()}
 return <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
  <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Catálogo</p><h1 className="mt-1 text-3xl font-black">Produtos</h1><p className="mt-2 text-slate-600">Gerencie os produtos persistidos no Supabase.</p></div><Link href="/admin/produtos/novo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"><Plus size={18}/>Adicionar produto</Link></section>
  <section className="rounded-2xl border bg-white p-4 shadow-sm"><ProductsToolbar search={search} category={category} status={status} featured={featured} categories={categories} hasFilters={Boolean(search)||category!=="all"||status!=="all"||featured!=="all"} onSearchChange={setSearch} onCategoryChange={setCategory} onStatusChange={setStatus} onFeaturedChange={setFeatured} onClear={clear}/></section>
  {feedback?<p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{feedback}</p>:null}
  {loading?<p>Carregando produtos…</p>:error?<div className="rounded-xl border border-red-200 bg-red-50 p-5"><p>{error}</p><button onClick={load} className="mt-3 font-bold">Tentar novamente</button></div>:<><div className="flex justify-between text-sm"><b>{filtered.length} produto(s) encontrado(s)</b><span>Total: {products.length}</span></div>{filtered.length?<ProductsList products={filtered} onDelete={setDeleting}/>:<EmptyProductsState onClear={clear}/>}</>}
  {deleting?<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black">Excluir “{deleting.title}”?</h2><p className="mt-2 text-slate-600">Esta ação não poderá ser desfeita.</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={()=>setDeleting(null)} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button disabled={busy} onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white">{busy?"Excluindo…":"Confirmar exclusão"}</button></div></section></div>:null}
 </main>
}
