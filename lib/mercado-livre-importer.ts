import "server-only";
import type { ImportedProduct } from "@/types/product-import";
import {MercadoLivreUrlParserError,parseMercadoLivreUrl} from "@/lib/mercado-livre-url-parser";
import {mercadoLivreAuthorizationHeaders,resolveCatalogProduct,type CatalogProduct} from "@/lib/mercado-livre-catalog";

const API_ORIGIN="https://api.mercadolibre.com";
const TIMEOUT_MS=10_000;

export type ImportErrorCode="INVALID_URL"|"ITEM_ID_NOT_FOUND"|"USER_PRODUCT_UNSUPPORTED"|"CATALOG_DATA_INCOMPLETE"|"OFFER_ITEM_NOT_FOUND"|"API_NOT_FOUND"|"API_UNAUTHORIZED"|"API_FORBIDDEN"|"TIMEOUT"|"NETWORK_ERROR"|"UNEXPECTED_RESPONSE"|"NORMALIZATION_ERROR";
export class MercadoLivreImportError extends Error{constructor(public readonly code:ImportErrorCode,message:string,public readonly details?:Record<string,unknown>,public readonly cause?:unknown){super(message);this.name="MercadoLivreImportError"}}

type MlItem={id?:unknown;title?:unknown;price?:unknown;original_price?:unknown;permalink?:unknown;thumbnail?:unknown;pictures?:unknown;attributes?:unknown;category_id?:unknown;catalog_product_id?:unknown};
type MlApiError={error?:unknown;message?:unknown;code?:unknown;status?:unknown};

function parseIdentifier(rawUrl:string){
  try{
    const identifier=parseMercadoLivreUrl(rawUrl);
    return identifier;
  }catch(error){
    if(error instanceof MercadoLivreImportError)throw error;
    if(error instanceof MercadoLivreUrlParserError)throw new MercadoLivreImportError(error.code,error.message,error.details,error);
    throw error;
  }
}
export function getMercadoLivreItemId(rawUrl:string):string{
  const identifier=parseIdentifier(rawUrl);
  if(identifier.catalogDetected)throw new MercadoLivreImportError("ITEM_ID_NOT_FOUND","A URL contém um produto de catálogo, não um ITEM_ID de anúncio.",{productId:identifier.productId});
  return identifier.itemId;
}

function isTimeout(error:unknown){return error instanceof Error&&(error.name==="AbortError"||error.name==="TimeoutError"||/timeout/i.test(error.message))}
async function apiJson<T>(path:string,accessToken:string,optional404=false):Promise<T|undefined>{
  const url=`${API_ORIGIN}${path}`;
  const method="GET";
  const headers=mercadoLivreAuthorizationHeaders(accessToken);
  const headerNames=Object.keys(headers).map(name=>name.toLowerCase());
  console.info("[product-import] Mercado Livre API request diagnostic",{
    baseUrl:new URL(url).origin,
    method,
    endpoint:path,
    authorizationHeaderPresent:headerNames.includes("authorization"),
    xAccessTokenHeaderPresent:headerNames.includes("x-access-token"),
    userAgent:headers["User-Agent"],
  });
  let response:Response;
  try{response=await fetch(url,{method,headers,cache:"no-store",signal:AbortSignal.timeout(TIMEOUT_MS)})}
  catch(error){if(isTimeout(error))throw new MercadoLivreImportError("TIMEOUT","A API do Mercado Livre excedeu 10 segundos.",{endpoint:path},error);throw new MercadoLivreImportError("NETWORK_ERROR","Erro de rede ao consultar a API do Mercado Livre.",{endpoint:path},error)}
  const contentType=response.headers.get("content-type")??"";
  let body:unknown;
  if(contentType.includes("json")){try{body=await response.json()}catch(error){throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou JSON inválido.",{endpoint:path,status:response.status},error)}}
  const safeResponseBody=body&&typeof body==="object"&&!Array.isArray(body)?body as MlApiError:{};
  console.info("[product-import] Mercado Livre API response diagnostic",{
    baseUrl:new URL(url).origin,
    method,
    endpoint:path,
    status:response.status,
    body:{
      error:safeResponseBody.error,
      message:safeResponseBody.message,
      status:safeResponseBody.status,
    },
  });
  const apiError=body&&typeof body==="object"?body as MlApiError:{};
  const details={endpoint:path,status:response.status,apiCode:String(apiError.code??apiError.error??""),apiMessage:String(apiError.message??"").slice(0,240),apiResponse:true};
  if(response.status===404){if(optional404)return undefined;throw new MercadoLivreImportError("API_NOT_FOUND","A API do Mercado Livre não encontrou o recurso.",details)}
  if(response.status===401)throw new MercadoLivreImportError("API_UNAUTHORIZED","O access token do Mercado Livre expirou ou foi revogado. Conecte a conta novamente.",details);
  if(response.status===403)throw new MercadoLivreImportError("API_FORBIDDEN","A API oficial do Mercado Livre recusou a consulta (403). Verifique as permissões da aplicação e da conta autorizada.",details);
  if(!response.ok)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE",`A API do Mercado Livre respondeu com status inesperado (${response.status}).`,details);
  if(!contentType.includes("json")||body===undefined)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou um formato inesperado.",{endpoint:path,status:response.status,contentType});
  return body as T;
}

async function apiItem<T>(itemId:string,accessToken:string):Promise<T>{
  try{return(await apiJson<T>(`/items/${encodeURIComponent(itemId)}`,accessToken))!}
  catch(error){
    if(error instanceof MercadoLivreImportError&&error.code==="API_FORBIDDEN")await diagnoseForbiddenItem(itemId,accessToken);
    throw error;
  }
}

async function diagnosticGet(label:string,path:string,accessToken:string){
  let status=0,error="",message="";
  try{
    const response=await fetch(`${API_ORIGIN}${path}`,{method:"GET",headers:mercadoLivreAuthorizationHeaders(accessToken),cache:"no-store",signal:AbortSignal.timeout(TIMEOUT_MS)});
    status=response.status;
    if((response.headers.get("content-type")??"").includes("json")){
      try{
        const parsed=await response.json() as unknown;
        const entry=Array.isArray(parsed)&&parsed[0]&&typeof parsed[0]==="object"?parsed[0] as{code?:unknown;body?:MlApiError}:undefined;
        const body=entry?.body??(parsed&&typeof parsed==="object"?parsed as MlApiError:{});
        if(entry?.code!==undefined)status=Number(entry.code)||status;
        error=String(body.error??body.code??"");
        message=String(body.message??"").slice(0,240);
      }catch{message="Resposta JSON inválida."}
    }
  }catch(cause){error="diagnostic_request_failed";message=cause instanceof Error?cause.name:"unknown"}
  console.error(label,{status,error,message});
}

async function diagnoseForbiddenItem(itemId:string,accessToken:string){
  const encodedItemId=encodeURIComponent(itemId);
  await diagnosticGet("[product-import] item attributes diagnostic",`/items/${encodedItemId}?attributes=id,title,price,thumbnail,permalink`,accessToken);
  await diagnosticGet("[product-import] item multiget diagnostic",`/items?ids=${encodedItemId}&attributes=id,title`,accessToken);
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

function catalogAsItem(product:CatalogProduct,item:MlItem|undefined,offer:{price?:unknown;original_price?:unknown;category_id?:unknown}|undefined,sourceUrl:string):MlItem{
  return{
    id:product.id,
    title:item?.title??product.name,
    price:item?.price??offer?.price,
    original_price:item?.original_price??offer?.original_price,
    permalink:item?.permalink??sourceUrl,
    thumbnail:item?.thumbnail,
    pictures:item?.pictures??product.pictures,
    attributes:item?.attributes??product.attributes,
    category_id:item?.category_id??offer?.category_id,
  };
}

function itemWithCatalogAttributes(item:MlItem,product:CatalogProduct|undefined):MlItem{
  if(!product)return item;
  const itemAttributes=Array.isArray(item.attributes)?item.attributes as Array<Record<string,unknown>>:[];
  const catalogAttributes=Array.isArray(product.attributes)?product.attributes as Array<Record<string,unknown>>:[];
  const itemAttributeIds=new Set(itemAttributes.map(attribute=>String(attribute.id??"")).filter(Boolean));
  return{...item,attributes:[...itemAttributes,...catalogAttributes.filter(attribute=>!itemAttributeIds.has(String(attribute.id??"")))]};
}

export async function importMercadoLivreProduct(rawUrl:string,accessToken:string):Promise<ImportedProduct>{
  if(!accessToken)throw new MercadoLivreImportError("API_UNAUTHORIZED","Access token do Mercado Livre não disponível.");
  const request=<T>(path:string,token=accessToken,optional404=false)=>apiJson<T>(path,token,optional404);
  const requestItem=<T>(itemId:string)=>apiItem<T>(itemId,accessToken);
  const identifier=parseIdentifier(rawUrl);
  if(identifier.catalogDetected){
    if(identifier.itemId){
      const item=await requestItem<MlItem>(identifier.itemId);
      const itemCatalogProductId=String(item?.catalog_product_id??"").toUpperCase();
      if(itemCatalogProductId&&itemCatalogProductId!==identifier.productId)throw new MercadoLivreImportError("OFFER_ITEM_NOT_FOUND",`A oferta ${identifier.itemId} não pertence ao produto de catálogo ${identifier.productId}.`,{productId:identifier.productId,itemId:identifier.itemId});
      let product:CatalogProduct|undefined;
      try{product=await request<CatalogProduct>(`/products/${encodeURIComponent(itemCatalogProductId||identifier.productId)}`)}catch(error){if(!(error instanceof MercadoLivreImportError&&error.code==="API_FORBIDDEN"))throw error}
      const enrichedItem=itemWithCatalogAttributes(item!,product);
      const [description,category]=await Promise.all([
        request<{plain_text?:unknown}>(`/items/${encodeURIComponent(identifier.itemId)}/description`,accessToken,true),
        enrichedItem.category_id?request<{name?:unknown}>(`/categories/${encodeURIComponent(String(enrichedItem.category_id))}`,accessToken,true):undefined,
      ]);
      return normalize(enrichedItem,description,category);
    }
    try{
      const resolved=await resolveCatalogProduct<MlItem>(identifier.productId,accessToken,request,requestItem);
      const combined=catalogAsItem(resolved.product,resolved.item,resolved.offer,rawUrl);
      const price=positiveNumber(combined.price),pictures=Array.isArray(combined.pictures)?combined.pictures:[];
      if(!price||!String(combined.title??"").trim()||!pictures.length)throw new MercadoLivreImportError("CATALOG_DATA_INCOMPLETE",`O catálogo ${identifier.productId} não forneceu dados suficientes para preencher o formulário${resolved.itemId?" mesmo após consultar a oferta associada":" e nenhuma oferta válida foi encontrada"}.`,{productId:identifier.productId,itemId:resolved.itemId,missing:[!combined.title?"title":null,!price?"price":null,!pictures.length?"pictures":null].filter(Boolean)});
      const [description,category]=await Promise.all([
        resolved.itemId?request<{plain_text?:unknown}>(`/items/${encodeURIComponent(resolved.itemId)}/description`,accessToken,true):undefined,
        combined.category_id?request<{name?:unknown}>(`/categories/${encodeURIComponent(String(combined.category_id))}`,accessToken,true):undefined,
      ]);
      return normalize(combined,description,category);
    }catch(error){throw error}
  }
  const itemId=identifier.itemId;
  const item=await requestItem<MlItem>(itemId);
  const [description,category]=await Promise.all([
    request<{plain_text?:unknown}>(`/items/${encodeURIComponent(itemId)}/description`,accessToken,true),
    item?.category_id?request<{name?:unknown}>(`/categories/${encodeURIComponent(String(item.category_id))}`,accessToken,true):undefined,
  ]);
  return normalize(item!,description,category);
}
