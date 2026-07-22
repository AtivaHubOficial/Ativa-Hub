import "server-only";
import type { ImportedProduct } from "@/types/product-import";

const API_ORIGIN="https://api.mercadolibre.com";
const ALLOWED_HOSTS=new Set(["mercadolivre.com.br","www.mercadolivre.com.br","produto.mercadolivre.com.br"]);
const TIMEOUT_MS=10_000;

export type ImportErrorCode="INVALID_URL"|"ITEM_ID_NOT_FOUND"|"CATALOG_URL_UNSUPPORTED"|"API_NOT_FOUND"|"API_UNAUTHORIZED"|"API_FORBIDDEN"|"TIMEOUT"|"NETWORK_ERROR"|"UNEXPECTED_RESPONSE"|"NORMALIZATION_ERROR";
export class MercadoLivreImportError extends Error{constructor(public readonly code:ImportErrorCode,message:string,public readonly details?:Record<string,unknown>,public readonly cause?:unknown){super(message);this.name="MercadoLivreImportError"}}

type MlItem={id?:unknown;title?:unknown;price?:unknown;original_price?:unknown;permalink?:unknown;thumbnail?:unknown;pictures?:unknown;attributes?:unknown;category_id?:unknown};
type MlApiError={error?:unknown;message?:unknown;code?:unknown;status?:unknown};

function extractItemId(rawUrl:string):string{
  let url:URL;
  try{url=new URL(rawUrl)}catch{throw new MercadoLivreImportError("INVALID_URL","URL inválida. Informe o endereço completo do anúncio.")}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||!ALLOWED_HOSTS.has(host))throw new MercadoLivreImportError("INVALID_URL","URL inválida. Use um link HTTPS do Mercado Livre Brasil.",{host,protocol:url.protocol});
  const queryItem=url.searchParams.get("item_id")?.match(/^MLB[-_]?([0-9]{6,})$/i);
  if(queryItem)return`MLB${queryItem[1]}`;
  const catalogProduct=url.pathname.match(/\/p\/(MLB[0-9]{6,})(?:\/|$)/i);
  if(catalogProduct)throw new MercadoLivreImportError("CATALOG_URL_UNSUPPORTED",`A URL contém o produto de catálogo ${catalogProduct[1].toUpperCase()}, não um anúncio. Abra uma oferta específica e copie a URL no formato /MLB-1234567890-...`,{productId:catalogProduct[1].toUpperCase()});
  const listing=url.pathname.match(/(?:^|\/)MLB[-_]([0-9]{6,})(?:-|_|\/|$)/i);
  if(!listing)throw new MercadoLivreImportError("ITEM_ID_NOT_FOUND","ITEM_ID não encontrado na URL. Use a URL completa de uma oferta no formato /MLB-1234567890-..., não um link encurtado ou página de catálogo.");
  return`MLB${listing[1]}`;
}
export const getMercadoLivreItemId=extractItemId;

function isTimeout(error:unknown){return error instanceof Error&&(error.name==="AbortError"||error.name==="TimeoutError"||/timeout/i.test(error.message))}
async function apiJson<T>(path:string,accessToken:string,optional404=false):Promise<T|undefined>{
  const url=`${API_ORIGIN}${path}`;
  let response:Response;
  try{response=await fetch(url,{headers:{Accept:"application/json",Authorization:`Bearer ${accessToken}`,"User-Agent":"AtivaHub/2.0 (+product-importer)"},cache:"no-store",signal:AbortSignal.timeout(TIMEOUT_MS)})}
  catch(error){if(isTimeout(error))throw new MercadoLivreImportError("TIMEOUT","A API do Mercado Livre excedeu 10 segundos.",{endpoint:path},error);throw new MercadoLivreImportError("NETWORK_ERROR","Erro de rede ao consultar a API do Mercado Livre.",{endpoint:path},error)}
  const contentType=response.headers.get("content-type")??"";
  let body:unknown;
  if(contentType.includes("json")){try{body=await response.json()}catch(error){throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou JSON inválido.",{endpoint:path,status:response.status},error)}}
  if(response.status===404){if(optional404)return undefined;throw new MercadoLivreImportError("API_NOT_FOUND","O anúncio não foi encontrado na API oficial do Mercado Livre (404).",{endpoint:path,status:404})}
  const apiError=body&&typeof body==="object"?body as MlApiError:{};
  const details={endpoint:path,status:response.status,apiCode:String(apiError.code??apiError.error??""),apiMessage:String(apiError.message??"")};
  if(response.status===401)throw new MercadoLivreImportError("API_UNAUTHORIZED","O access token do Mercado Livre expirou ou foi revogado. Conecte a conta novamente.",details);
  if(response.status===403)throw new MercadoLivreImportError("API_FORBIDDEN","A API oficial do Mercado Livre recusou a consulta (403). Verifique as permissões da aplicação e da conta autorizada.",details);
  if(!response.ok)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE",`A API do Mercado Livre respondeu com status inesperado (${response.status}).`,details);
  if(!contentType.includes("json")||body===undefined)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou um formato inesperado.",{endpoint:path,status:response.status,contentType});
  return body as T;
}

function strings(value:unknown):string[]{if(typeof value==="string")return[value];if(Array.isArray(value))return value.flatMap(strings);if(value&&typeof value==="object"&&"url" in value)return strings((value as{url:unknown}).url);return[]}
function positiveNumber(value:unknown):number|undefined{const number=typeof value==="number"?value:Number(value);return Number.isFinite(number)&&number>0?number:undefined}
function normalize(item:MlItem,description?:{plain_text?:unknown},category?:{name?:unknown}):ImportedProduct{
  try{
    const attributes=Array.isArray(item.attributes)?item.attributes as Array<Record<string,unknown>>:[];
    const specifications=attributes.map(attribute=>({name:String(attribute.name??"").trim(),value:String(attribute.value_name??"").trim()})).filter(attribute=>attribute.name&&attribute.value);
    const pictures=Array.isArray(item.pictures)?item.pictures as Array<Record<string,unknown>>:[];
    const images=pictures.flatMap(picture=>strings(picture.secure_url??picture.url)).filter(url=>url.startsWith("https://"));
    const thumbnail=String(item.thumbnail??"").replace(/^http:/,"https:");
    if(!images.length&&thumbnail.startsWith("https://"))images.push(thumbnail);
    const id=String(item.id??"").trim(),title=String(item.title??"").trim(),price=positiveNumber(item.price);
    if(!id||!title||!price||!images.length)throw new Error("Campos obrigatórios ausentes: id, title, price ou pictures.");
    const text=String(description?.plain_text??"").trim(),oldPrice=positiveNumber(item.original_price);
    return{source:"Mercado Livre",sourceId:id,sourceUrl:String(item.permalink??"")||`https://produto.mercadolivre.com.br/${id}`,title,brand:specifications.find(attribute=>/^(marca|brand)$/i.test(attribute.name))?.value??"",category:String(category?.name??""),shortDescription:text.slice(0,240),description:text,price,oldPrice:oldPrice&&oldPrice>=price?oldPrice:null,images:[...new Set(images)],specifications};
  }catch(error){throw new MercadoLivreImportError("NORMALIZATION_ERROR","Falha ao normalizar os dados retornados pela API oficial do Mercado Livre.",{source:"api"},error)}
}

export async function importMercadoLivreProduct(rawUrl:string,accessToken:string):Promise<ImportedProduct>{
  if(!accessToken)throw new MercadoLivreImportError("API_UNAUTHORIZED","Access token do Mercado Livre não disponível.");
  const itemId=extractItemId(rawUrl);
  const item=await apiJson<MlItem>(`/items/${encodeURIComponent(itemId)}`,accessToken);
  const [description,category]=await Promise.all([
    apiJson<{plain_text?:unknown}>(`/items/${encodeURIComponent(itemId)}/description`,accessToken,true),
    item?.category_id?apiJson<{name?:unknown}>(`/categories/${encodeURIComponent(String(item.category_id))}`,accessToken,true):undefined,
  ]);
  return normalize(item!,description,category);
}
