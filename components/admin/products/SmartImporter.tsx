"use client";
import {useState} from "react";
import {ChevronDown,Link2,Sparkles,WandSparkles} from "lucide-react";
import type {ImportedProduct} from "@/types/product-import";

type ImportResponse={product?:ImportedProduct;authorizeUrl?:string};

export default function SmartImporter({onImported}:{onImported:(product:ImportedProduct)=>void}){
  const[url,setUrl]=useState("");
  const[pending,setPending]=useState(false);
  const[message,setMessage]=useState("");
  const[authorizeUrl,setAuthorizeUrl]=useState("");
  const[experimentalOpen,setExperimentalOpen]=useState(false);

  async function run(){
    setPending(true);setMessage("");setAuthorizeUrl("");
    try{
      const response=await fetch("/api/admin/import-product",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url}),signal:AbortSignal.timeout(20_000)});
      const body=await response.json() as ImportResponse;
      if(!response.ok||!body.product){
        if(body.authorizeUrl)setAuthorizeUrl(body.authorizeUrl);
        throw new Error();
      }
      onImported(body.product);
      setMessage(body.product.warning??"Dados importados. Revise os campos antes de cadastrar.");
    }catch{
      setMessage("Importação automática indisponível para este produto.\nVocê ainda pode cadastrar o produto manualmente.");
    }finally{setPending(false)}
  }

  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-400 p-2"><Sparkles size={20}/></span><div><h2 className="text-lg font-black">Cadastro assistido</h2><p className="mt-1 text-sm text-slate-600">Cole o link de afiliado no formulário e preencha os dados manualmente.</p></div></div>
      </div>
      <button type="button" onClick={()=>setMessage("Geração com IA será disponibilizada em uma próxima etapa. Preencha os campos manualmente por enquanto.")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 font-bold text-slate-800"><WandSparkles size={18}/>Gerar conteúdo com IA</button>
    </div>
    <button type="button" aria-expanded={experimentalOpen} onClick={()=>setExperimentalOpen(value=>!value)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 underline underline-offset-4">Importação experimental <ChevronDown className={experimentalOpen?"rotate-180":""} size={16}/></button>
    {experimentalOpen?<div className="mt-4 border-t border-amber-200 pt-4"><p className="text-sm text-slate-600">Este recurso pode não funcionar para todos os produtos e nunca impede o cadastro manual.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><span className="sr-only">URL do produto</span><Link2 className="absolute left-3 top-3.5 text-slate-400" size={18}/><input type="url" value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://www.mercadolivre.com.br/..." className="min-h-12 w-full rounded-xl border border-amber-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-500"/></label><button type="button" onClick={run} disabled={pending||!url.trim()} className="min-h-12 rounded-xl bg-slate-900 px-5 font-bold text-white disabled:opacity-50">{pending?"Importando…":"Tentar importar"}</button></div>{authorizeUrl?<a href={authorizeUrl} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950">Conectar Mercado Livre</a>:null}</div>:null}
    {message?<p role="status" className="mt-3 whitespace-pre-line text-sm font-bold text-slate-700">{message}</p>:null}
  </section>
}
