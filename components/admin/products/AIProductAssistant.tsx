"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { AIProductBlock, AIProductContent } from "@/types/ai-product-assistant";

const options: Array<{ block: AIProductBlock; label: string }> = [
  { block:"all",label:"Gerar conteúdo com IA" },{ block:"title",label:"Título" },{ block:"shortDescription",label:"Descrição curta" },{ block:"description",label:"Descrição completa" },
  { block:"benefits",label:"Benefícios" },{ block:"faq",label:"FAQ" },{ block:"cta",label:"CTA" },
  { block:"seo",label:"SEO" },{ block:"identity",label:"Marca e categoria" },{ block:"specifications",label:"Especificações" },
];
type AssistantRequest = { block: AIProductBlock; resolve: (content: AIProductContent) => void; reject: (message: string) => void };
export default function AIProductAssistant() {
  const [processing,setProcessing]=useState<AIProductBlock|null>(null);
  const [message,setMessage]=useState("");
  const [preview,setPreview]=useState<AIProductContent|null>(null);
  async function generate(block:AIProductBlock) {
    setProcessing(block);setMessage("");
    try {
      const content=await new Promise<AIProductContent>((resolve,reject)=>{
        window.dispatchEvent(new CustomEvent<AssistantRequest>("ativa-ai-product-request",{detail:{block,resolve,reject}}));
      });
      setPreview(content);setMessage(block==="all"?"Conteúdo completo aplicado. Revise todos os campos antes de salvar.":"Bloco regenerado e aplicado.");
    } catch(error) { setMessage(error instanceof Error?error.message:"Não foi possível gerar o conteúdo."); }
    finally { setProcessing(null); }
  }
  return <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm"><div className="flex items-start gap-3"><span className="rounded-xl bg-violet-600 p-2 text-white"><Sparkles size={20}/></span><div><h2 className="text-lg font-black">AI Product Assistant</h2><p className="mt-1 text-sm text-slate-600">Gera conteúdo comercial com o provider local. Todos os campos permanecem editáveis antes do salvamento.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{options.map(option=><button key={option.block} type="button" disabled={Boolean(processing)} onClick={()=>generate(option.block)} className="min-h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm font-bold text-violet-800 disabled:opacity-50">{processing===option.block?"Processando…":option.label}</button>)}</div>{message?<p role="status" className="mt-3 text-sm font-bold text-violet-800">{message}</p>:null}{preview?<details className="mt-4 rounded-xl border border-violet-100 bg-white p-3"><summary className="cursor-pointer text-sm font-bold">Prévia SEO gerada</summary><dl className="mt-3 space-y-2 text-sm"><div><dt className="font-bold">Meta Title</dt><dd>{preview.metaTitle}</dd></div><div><dt className="font-bold">Meta Description</dt><dd>{preview.metaDescription}</dd></div><div><dt className="font-bold">Open Graph</dt><dd>{preview.openGraphDescription}</dd></div><div><dt className="font-bold">Palavras-chave</dt><dd>{preview.keywords.join(", ")}</dd></div></dl></details>:null}</section>;
}
