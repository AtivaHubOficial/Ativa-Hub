import "server-only";
import {LogzzError} from "./errors";
import {requestLogzzProducts} from "./transport";
import type {LogzzProductsResponse} from "./types";

const DEFAULT_BASE_URL="https://app.logzz.com.br/api/v1";
export async function listLogzzProducts(options?:{fetchImpl?:typeof fetch;token?:string;baseUrl?:string}):Promise<LogzzProductsResponse>{
  const token=(options?.token??process.env.LOGZZ_API_TOKEN)?.trim();
  if(!token)throw new LogzzError("LOGZZ_NOT_CONFIGURED","Token da Logzz não configurado.",503);
  const baseUrl=(options?.baseUrl??process.env.LOGZZ_API_BASE_URL??DEFAULT_BASE_URL).replace(/\/+$/,"");
  return requestLogzzProducts(token,baseUrl,options?.fetchImpl);
}
