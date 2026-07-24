import "server-only";
import type { ImportedProduct } from "@/types/product-import";
import {MercadoLivreUrlParserError,parseMercadoLivreUrl} from "@/lib/mercado-livre-url-parser";
import {mercadoLivreAuthorizationHeaders,resolveCatalogProduct,type CatalogProduct} from "@/lib/mercado-livre-catalog";

const API_ORIGIN="https://api.mercadolibre.com";
const TIMEOUT_MS=10_000;

export type ImportErrorCode="INVALID_URL"|"ITEM_ID_NOT_FOUND"|"USER_PRODUCT_UNSUPPORTED"|"CATALOG_DATA_INCOMPLETE"|"OFFER_ITEM_NOT_FOUND"|"API_NOT_FOUND"|"API_UNAUTHORIZED"|"API_FORBIDDEN"|"RATE_LIMIT"|"API_UNAVAILABLE"|"TIMEOUT"|"NETWORK_ERROR"|"UNEXPECTED_RESPONSE"|"NORMALIZATION_ERROR";
export class MercadoLivreImportError extends Error{constructor(public readonly code:ImportErrorCode,message:string,public readonly details?:Record<string,unknown>,public readonly cause?:unknown){super(message);this.name="MercadoLivreImportError"}}

type MlItem={id?:unknown;title?:unknown;price?:unknown;original_price?:unknown;permalink?:unknown;thumbnail?:unknown;pictures?:unknown;attributes?:unknown;category_id?:unknown;catalog_product_id?:unknown;available_quantity?:unknown;variations?:unknown};
type MlReviews={rating_average?:unknown;paging?:{total?:unknown}};
type MlApiError={error?:unknown;message?:unknown;code?:unknown;status?:unknown};
type MlUserProduct=CatalogProduct&{catalog_product_id?:unknown;category_id?:unknown};

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
  if(!identifier.itemId)throw new MercadoLivreImportError("USER_PRODUCT_UNSUPPORTED","A URL contém um User Product sem ITEM_ID explícito.",{userProductId:identifier.userProductId});
  return identifier.itemId;
}

function isTimeout(error:unknown){return error instanceof Error&&(error.name==="AbortError"||error.name==="TimeoutError"||/timeout/i.test(error.message))}
async function apiJson<T>(path:string,accessToken:string,optional404=false):Promise<T|undefined>{
  const url=`${API_ORIGIN}${path}`;
  const headers=mercadoLivreAuthorizationHeaders(accessToken);
  let response:Response;
  try{response=await fetch(url,{method:"GET",headers,cache:"no-store",signal:AbortSignal.timeout(TIMEOUT_MS)})}
  catch(error){if(isTimeout(error))throw new MercadoLivreImportError("TIMEOUT","A API do Mercado Livre excedeu 10 segundos.",{endpoint:path},error);throw new MercadoLivreImportError("NETWORK_ERROR","Erro de rede ao consultar a API do Mercado Livre.",{endpoint:path},error)}
  const contentType=response.headers.get("content-type")??"";
  let body:unknown;
  if(contentType.includes("json")){try{body=await response.json()}catch(error){throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou JSON inválido.",{endpoint:path,status:response.status},error)}}
  const apiError=body&&typeof body==="object"?body as MlApiError:{};
  const details={endpoint:path,status:response.status,apiCode:String(apiError.code??apiError.error??""),apiMessage:String(apiError.message??"").slice(0,240),apiResponse:true};
  if(response.status===404){if(optional404)return undefined;throw new MercadoLivreImportError("API_NOT_FOUND","A API do Mercado Livre não encontrou o recurso.",details)}
  if(response.status===401)throw new MercadoLivreImportError("API_UNAUTHORIZED","O access token do Mercado Livre expirou ou foi revogado. Conecte a conta novamente.",details);
  if(response.status===403)throw new MercadoLivreImportError("API_FORBIDDEN","A API oficial do Mercado Livre recusou a consulta (403). Verifique as permissões da aplicação e da conta autorizada.",details);
  if(response.status===429)throw new MercadoLivreImportError("RATE_LIMIT","O limite de consultas do Mercado Livre foi atingido. Aguarde e tente novamente.",details);
  if(response.status>=500)throw new MercadoLivreImportError("API_UNAVAILABLE","A API do Mercado Livre está temporariamente indisponível.",details);
  if(!response.ok)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE",`A API do Mercado Livre respondeu com status inesperado (${response.status}).`,details);
  if(!contentType.includes("json")||body===undefined)throw new MercadoLivreImportError("UNEXPECTED_RESPONSE","A API do Mercado Livre retornou um formato inesperado.",{endpoint:path,status:response.status,contentType});
  return body as T;
}

async function apiItem<T>(itemId:string,accessToken:string,allowForbiddenFallback=false):Promise<T|undefined>{
  try{return await apiJson<T>(`/items/${encodeURIComponent(itemId)}`,accessToken)}
  catch(error){if(allowForbiddenFallback&&error instanceof MercadoLivreImportError&&error.code==="API_FORBIDDEN")return undefined;throw error}
}

function strings(value:unknown):string[]{if(typeof value==="string")return[value];if(Array.isArray(value))return value.flatMap(strings);if(value&&typeof value==="object"&&"url" in value)return strings((value as{url:unknown}).url);return[]}
function positiveNumber(value:unknown):number|undefined{const number=typeof value==="number"?value:Number(value);return Number.isFinite(number)&&number>0?number:undefined}
function normalize(item:MlItem,description?:{plain_text?:unknown},category?:{name?:unknown},partial=false,reviews?:MlReviews,sourceUrl?:string):ImportedProduct{
  try{
    const attributes=Array.isArray(item.attributes)?item.attributes as Array<Record<string,unknown>>:[];
    const specifications=attributes.map(attribute=>{const values=Array.isArray(attribute.values)?attribute.values as Array<Record<string,unknown>>:[];return{name:String(attribute.name??"").trim(),value:String(attribute.value_name??values[0]?.name??"").trim()}}).filter(attribute=>attribute.name&&attribute.value);
    const variations=Array.isArray(item.variations)?item.variations as Array<Record<string,unknown>>:[];
    const pictures=[...(Array.isArray(item.pictures)?item.pictures as Array<Record<string,unknown>>:[]),...variations.flatMap(variation=>Array.isArray(variation.pictures)?variation.pictures as Array<Record<string,unknown>>:[])];
    const images=pictures.flatMap(picture=>strings(picture.secure_url??picture.url)).filter(url=>url.startsWith("https://"));
    const thumbnail=String(item.thumbnail??"").replace(/^http:/,"https:");
    if(!images.length&&thumbnail.startsWith("https://"))images.push(thumbnail);
    const id=String(item.id??"").trim(),title=String(item.title??"").trim(),price=positiveNumber(item.price);
    if(!partial&&(!id||!title||!price||!images.length))throw new Error("Campos obrigatórios ausentes: id, title, price ou pictures.");
    const text=String(description?.plain_text??"").trim(),oldPrice=positiveNumber(item.original_price);
    const availableQuantity=Number(item.available_quantity);
    if(Number.isFinite(availableQuantity)&&availableQuantity>=0)specifications.push({name:"Estoque disponível",value:String(availableQuantity)});
    return{source:"Mercado Livre",sourceId:id,sourceUrl:sourceUrl||String(item.permalink??"")||`https://produto.mercadolivre.com.br/${id}`,title,brand:specifications.find(attribute=>/^(marca|brand)$/i.test(attribute.name))?.value??"",category:String(category?.name??""),shortDescription:text.slice(0,240),description:text,price:price??0,oldPrice:oldPrice&&price&&oldPrice>=price?oldPrice:null,images:[...new Set(images)],specifications,rating:positiveNumber(reviews?.rating_average)??0,reviewCount:Number(reviews?.paging?.total)||0,availableQuantity:Number.isFinite(availableQuantity)?availableQuantity:undefined,...partial?{warning:"Importação parcial: o Mercado Livre não autorizou o acesso à oferta. Revise e complete manualmente os campos vazios antes de cadastrar."}:{}};
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
  const identifier=parseIdentifier(rawUrl);
  async function fullItem(itemId:string,item:MlItem){
    const [description,category,reviews]=await Promise.all([
      request<{plain_text?:unknown}>(`/items/${encodeURIComponent(itemId)}/description`,accessToken,true),
      item.category_id?request<{name?:unknown}>(`/categories/${encodeURIComponent(String(item.category_id))}`,accessToken,true):undefined,
      request<MlReviews>(`/reviews/item/${encodeURIComponent(itemId)}`,accessToken,true),
    ]);
    return normalize(item,description,category,false,reviews,rawUrl);
  }
  async function catalogImport(productId:string,preferredItemId:string|null,itemAlreadyForbidden=false){
    const resolved=await resolveCatalogProduct<MlItem>(productId,preferredItemId,accessToken,request,async<T>(itemId:string)=>{
      if(itemAlreadyForbidden)return undefined;
      return apiItem<T>(itemId,accessToken,true);
    });
    if(resolved.item){
      const itemCatalogProductId=String(resolved.item.catalog_product_id??"").toUpperCase();
      if(itemCatalogProductId&&itemCatalogProductId!==productId)throw new MercadoLivreImportError("OFFER_ITEM_NOT_FOUND",`A oferta ${resolved.itemId} não pertence ao produto de catálogo ${productId}.`,{productId,itemId:resolved.itemId});
      return fullItem(resolved.itemId!,itemWithCatalogAttributes(resolved.item,resolved.product));
    }
    const combined=catalogAsItem(resolved.product,undefined,resolved.offer,rawUrl);
    const category=combined.category_id?await request<{name?:unknown}>(`/categories/${encodeURIComponent(String(combined.category_id))}`,accessToken,true):undefined;
    return normalize(combined,undefined,category,true,undefined,rawUrl);
  }
  if(identifier.catalogDetected)return catalogImport(identifier.productId,identifier.itemId);
  if(identifier.userProductId){
    let itemForbidden=false;
    if(identifier.itemId){
      const item=await apiItem<MlItem>(identifier.itemId,accessToken,true);
      if(item)return fullItem(identifier.itemId,item);
      itemForbidden=true;
    }
    const userProduct=await request<MlUserProduct>(`/user-products/${encodeURIComponent(identifier.userProductId)}`);
    const productId=String(userProduct?.catalog_product_id??"").toUpperCase();
    if(productId&&/^MLB[0-9]+$/.test(productId))return catalogImport(productId,identifier.itemId,itemForbidden);
    const partial: MlItem={id:userProduct?.id,title:userProduct?.name,pictures:userProduct?.pictures,attributes:userProduct?.attributes,category_id:userProduct?.category_id,permalink:rawUrl};
    return normalize(partial,undefined,undefined,true,undefined,rawUrl);
  }
  const itemId=identifier.itemId!;
  const item=await apiItem<MlItem>(itemId,accessToken);
  return fullItem(itemId,item!);
}
