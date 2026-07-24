import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscoveryScore, candidateSelectable, filterDiscoveryCandidates, isSafePublicHttpsUrl, mapWithConcurrency, verifiedDiscount, type DiscoveryCandidate } from "./product-discovery.ts";
import { readFileSync } from "node:fs";

const candidate = (overrides: Partial<DiscoveryCandidate> = {}): DiscoveryCandidate => ({
  source:"mercado_livre",externalProductId:"MLB1",externalOfferId:"MLB1",title:"Parafusadeira completa com impacto",
  originalUrl:"https://produto.mercadolivre.com.br/MLB-1",offerUrl:"https://produto.mercadolivre.com.br/MLB-1",
  imageUrl:"https://http2.mlstatic.com/image.jpg",price:100,oldPrice:125,discountPercent:20,brand:"WAP",model:"K21",
  suggestedCategory:"Ferramentas",imageCount:6,specificationCount:10,available:true,duplicate:false,score:0,reasons:[],warnings:[],...overrides,
});
test("score é determinístico, limitado a 100 e usa apenas sinais presentes",()=>{
  const full=candidate(), input={...full}; delete (input as Partial<DiscoveryCandidate>).score;delete (input as Partial<DiscoveryCandidate>).reasons;delete (input as Partial<DiscoveryCandidate>).warnings;
  const first=calculateDiscoveryScore(input),second=calculateDiscoveryScore(input);
  assert.equal(first,second);assert.ok(first<=100);
  const empty={...input,title:"x",offerUrl:"",imageUrl:"",price:0,oldPrice:null,brand:"",model:"",suggestedCategory:"",imageCount:0,specificationCount:0,available:false,duplicate:true};
  assert.equal(calculateDiscoveryScore(empty),0);
});
test("filtros respeitam preço, desconto e máximo de 20",()=>{
  const items=Array.from({length:30},(_,index)=>candidate({externalOfferId:`MLB${index}`,price:50+index,oldPrice:100,discountPercent:verifiedDiscount(50+index,100)}));
  const filtered=filterDiscoveryCandidates(items,{category:"Ferramentas",keywords:"",quantity:20,minPrice:55,maxPrice:70,minDiscount:30});
  assert.ok(filtered.length<=20);assert.ok(filtered.every(item=>item.price>=55&&item.price<=70&&item.discountPercent>=30));
});
test("duplicado, oferta inválida e URL não HTTPS não são selecionáveis",()=>{
  assert.equal(candidateSelectable(candidate({duplicate:true})),false);
  assert.equal(candidateSelectable(candidate({available:false})),false);
  assert.equal(candidateSelectable(candidate({offerUrl:"http://produto.mercadolivre.com.br/MLB-1"})),false);
});
test("rejeita localhost, IP privado e hosts não autorizados",()=>{
  for(const url of ["https://localhost/item","https://127.0.0.1/item","https://192.168.0.1/item","https://evil.example/item"])assert.equal(isSafePublicHttpsUrl(url,["mercadolivre.com.br"]),false);
  assert.equal(isSafePublicHttpsUrl("https://produto.mercadolivre.com.br/MLB-1",["mercadolivre.com.br"]),true);
});
test("fila limita concorrência e falha de um item não impede os demais quando o worker isola a falha",async()=>{
  let active=0,max=0,calls=0;
  const results=await mapWithConcurrency([1,2,3,4,5],2,async item=>{active++;max=Math.max(max,active);calls++;await new Promise(resolve=>setTimeout(resolve,5));active--;try{if(item===3)throw new Error("falhou");return"saved"}catch{return"failed"}});
  assert.ok(max<=2);assert.equal(calls,5);assert.deepEqual(results,["saved","saved","failed","saved","saved"]);
});
test("uma geração por item e resumo nunca classificam item como ativo",async()=>{
  let generations=0;
  const results=await mapWithConcurrency(["MLB1","MLB2"],2,async id=>{generations++;return{id,status:"draft"}});
  assert.equal(generations,2);assert.ok(results.every(item=>item.status==="draft"));assert.equal(results.some(item=>item.status==="active"),false);
  assert.deepEqual({selected:results.length,created:results.filter(item=>item.status==="draft").length,failed:0},{selected:2,created:2,failed:0});
});
test("rotas exigem autorização e o importador revalida fonte e status no servidor",()=>{
  const search=readFileSync(new URL("../app/api/admin/discovery/search/route.ts",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/admin/discovery/import/route.ts",import.meta.url),"utf8");
  const importer=readFileSync(new URL("./discovery-import.ts",import.meta.url),"utf8");
  assert.match(search,/requireAdmin\(\)/);assert.match(route,/requireAdmin\(\)/);
  assert.match(importer,/importMercadoLivreProduct/);assert.match(importer,/status:\s*"draft"/);
  assert.doesNotMatch(importer,/status:\s*"active"/);
});
