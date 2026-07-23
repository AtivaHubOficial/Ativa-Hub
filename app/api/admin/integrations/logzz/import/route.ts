import {NextResponse} from "next/server";
import {requireAdmin} from "@/lib/admin-authorization";
import {listLogzzProducts} from "@/lib/connectors/logzz/client";
import {LogzzError,logzzErrorMessage} from "@/lib/connectors/logzz/errors";
import {mapLogzzCandidates} from "@/lib/connectors/logzz/mapper";
import {importLogzzCandidates} from "@/lib/connectors/logzz/importer";
export const runtime="nodejs";
export async function POST(request:Request){
  const admin=await requireAdmin();if(!admin.ok)return NextResponse.json({error:admin.error},{status:admin.status});
  let ids:string[];try{const body=await request.json() as{ids?:unknown};ids=Array.isArray(body.ids)?body.ids.filter((id):id is string=>typeof id==="string").slice(0,4000):[]}catch{return NextResponse.json({error:"Seleção inválida."},{status:400})}
  if(!ids.length)return NextResponse.json({error:"Selecione ao menos um produto."},{status:400});
  try{const available=mapLogzzCandidates(await listLogzzProducts()),selectedSet=new Set(ids),selected=available.filter(candidate=>selectedSet.has(candidate.id));if(selected.length!==selectedSet.size)return NextResponse.json({error:"A seleção contém produtos inválidos ou desatualizados."},{status:400});return NextResponse.json(await importLogzzCandidates(selected))}
  catch(error){if(error instanceof LogzzError)return NextResponse.json({error:logzzErrorMessage[error.code],code:error.code},{status:error.status});return NextResponse.json({error:"Alguns produtos não puderam ser importados."},{status:500})}
}
