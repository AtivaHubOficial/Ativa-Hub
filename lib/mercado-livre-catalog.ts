export type CatalogProduct={id?:unknown;name?:unknown;status?:unknown;domain_id?:unknown;attributes?:unknown;pictures?:unknown;children?:unknown};
export type CatalogOfferSummary={item_id?:unknown;price?:unknown;original_price?:unknown;category_id?:unknown;available_quantity?:unknown};
export type CatalogOffers={results?:unknown};

export type CatalogResolution<TItem>={product:CatalogProduct;offer:CatalogOfferSummary|undefined;item:TItem|undefined;itemId:string|null};

export function mercadoLivreAuthorizationHeaders(accessToken:string){
  return{Accept:"application/json",Authorization:`Bearer ${accessToken}`,"User-Agent":"AtivaHub/2.0 (+product-importer)"};
}

export async function resolveCatalogProduct<TItem>(
  productId:string,
  preferredItemId:string|null,
  accessToken:string,
  request:<T>(path:string,accessToken:string,optional404?:boolean)=>Promise<T|undefined>,
):Promise<CatalogResolution<TItem>>{
  const product=await request<CatalogProduct>(`/products/${encodeURIComponent(productId)}`,accessToken);
  let itemId=preferredItemId;
  let offer:CatalogOfferSummary|undefined;
  if(!itemId){
    const offers=await request<CatalogOffers>(`/products/${encodeURIComponent(productId)}/items`,accessToken,true);
    const results=Array.isArray(offers?.results)?offers.results as CatalogOfferSummary[]:[];
    offer=results.find(result=>typeof result.item_id==="string"&&/^MLB[0-9]+$/.test(result.item_id));
    itemId=offer?.item_id as string|undefined??null;
  }
  const item=itemId?await request<TItem>(`/items/${encodeURIComponent(itemId)}`,accessToken,true):undefined;
  return{product:product!,offer,item,itemId};
}
