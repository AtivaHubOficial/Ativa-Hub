import {LogzzError} from "./errors.ts";
import {parseLogzzResponse} from "./mapper.ts";
import type {LogzzProductsResponse} from "./types.ts";
export async function requestLogzzProducts(token:string,baseUrl:string,fetchImpl:typeof fetch=fetch):Promise<LogzzProductsResponse>{
  if(!token.trim())throw new LogzzError("LOGZZ_NOT_CONFIGURED","Token da Logzz não configurado.",503);
  let response:Response;
  try{response=await fetchImpl(`${baseUrl.replace(/\/+$/,"")}/products`,{method:"GET",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(15_000)})}
  catch{throw new LogzzError("LOGZZ_API_ERROR","Não foi possível consultar a Logzz.",502)}
  if(response.status===401||response.status===403)throw new LogzzError("LOGZZ_UNAUTHORIZED","Não autorizado pela Logzz.",401);
  if(response.status===429)throw new LogzzError("LOGZZ_RATE_LIMITED","Limite de requisições atingido.",429);
  if(!response.ok)throw new LogzzError("LOGZZ_API_ERROR","Não foi possível consultar a Logzz.",502);
  let body:unknown;try{body=await response.json()}catch{throw new LogzzError("LOGZZ_INVALID_RESPONSE","A Logzz retornou dados inválidos.",502)}
  return parseLogzzResponse(body);
}
