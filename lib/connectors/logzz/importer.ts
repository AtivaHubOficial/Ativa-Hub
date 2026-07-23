import "server-only";
import {createSupabaseServerClient} from "@/lib/supabase-server";
import {normalizeSlug} from "@/types/product-draft";
import type {LogzzImportCandidate} from "./types";

export type LogzzImportSummary={created:number;updated:number;failed:number;errors:string[]};
const key=(candidate:LogzzImportCandidate)=>`${candidate.externalProductId}:${candidate.externalOfferId}`;
export async function importLogzzCandidates(candidates:LogzzImportCandidate[]):Promise<LogzzImportSummary>{
  const client=await createSupabaseServerClient();
  if(!client)return{created:0,updated:0,failed:candidates.length,errors:["Supabase não configurado."]};
  const offerIds=[...new Set(candidates.map(candidate=>candidate.externalOfferId))];
  const{data:existing,error:lookupError}=await client.from("products").select("source,external_product_id,external_offer_id").eq("source","logzz").in("external_offer_id",offerIds);
  if(lookupError)return{created:0,updated:0,failed:candidates.length,errors:["Não foi possível verificar produtos existentes."]};
  const existingKeys=new Set((existing??[]).map(row=>`${row.external_product_id}:${row.external_offer_id}`));
  const summary:LogzzImportSummary={created:0,updated:0,failed:0,errors:[]};
  for(const candidate of candidates){
    if(!candidate.importable||!candidate.name||!candidate.externalProductId||!candidate.externalOfferId){summary.failed++;summary.errors.push(`${candidate.name||candidate.id}: dados obrigatórios ausentes.`);continue}
    const specifications=Object.entries(candidate.specifications).map(([name,value])=>({name,value:String(value??"")})).filter(item=>item.name&&item.value);
    const payload={source:"logzz",external_product_id:candidate.externalProductId,external_offer_id:candidate.externalOfferId,title:candidate.name,slug:`${normalizeSlug(candidate.name)||"produto"}-${normalizeSlug(candidate.externalOfferId).slice(-12)}`,brand:"",category:candidate.category||"Sem categoria",subcategory:null,price:candidate.price,old_price:null,rating:0,review_count:0,sold_count:0,full_shipping:false,free_shipping:false,installment_text:"",image_url:candidate.imageUrl,gallery:candidate.imageUrl?[candidate.imageUrl]:[],description:candidate.description,short_description:candidate.description.slice(0,240),features:[],tags:["logzz",candidate.role],affiliate_url:candidate.affiliateUrl,status:"active",featured:false,specifications};
    const{error}=await client.from("products").upsert(payload,{onConflict:"source,external_product_id,external_offer_id"});
    if(error){summary.failed++;summary.errors.push(`${candidate.name}: não foi possível salvar.`)}else if(existingKeys.has(key(candidate))){summary.updated++}else{summary.created++;existingKeys.add(key(candidate))}
  }
  return summary;
}
