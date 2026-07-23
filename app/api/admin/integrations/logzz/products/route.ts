import {NextResponse} from "next/server";
import {requireAdmin} from "@/lib/admin-authorization";
import {listLogzzProducts} from "@/lib/connectors/logzz/client";
import {LogzzError,logzzErrorMessage} from "@/lib/connectors/logzz/errors";
import {mapLogzzCandidates} from "@/lib/connectors/logzz/mapper";
export const runtime="nodejs";
export async function GET(){
  const admin=await requireAdmin();if(!admin.ok)return NextResponse.json({error:admin.error},{status:admin.status});
  try{return NextResponse.json({products:mapLogzzCandidates(await listLogzzProducts())})}
  catch(error){if(error instanceof LogzzError)return NextResponse.json({error:logzzErrorMessage[error.code],code:error.code},{status:error.status});return NextResponse.json({error:"Não foi possível consultar a Logzz.",code:"LOGZZ_API_ERROR"},{status:502})}
}
