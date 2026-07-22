import assert from "node:assert/strict";
import test from "node:test";
import {mercadoLivreAuthorizationHeaders,resolveCatalogProduct} from "./mercado-livre-catalog.ts";

test("monta o mesmo Bearer para catálogo e anúncios",()=>{
  assert.deepEqual(mercadoLivreAuthorizationHeaders("oauth-access-token"),{
    Accept:"application/json",
    Authorization:"Bearer oauth-access-token",
    "User-Agent":"AtivaHub/2.0 (+product-importer)",
  });
});

test("descobre oferta oficial somente no fluxo direto de catálogo",async()=>{
  const paths:string[]=[];
  const tokens:string[]=[];
  const result=await resolveCatalogProduct<{id:string}>("MLB50181290","oauth-access-token",async<T>(path:string,accessToken:string)=>{paths.push(path);tokens.push(accessToken);if(path.endsWith("/items"))return{results:[{item_id:"MLB4345564271"}]} as T;return{id:"MLB50181290"} as T},async<T>(itemId:string)=>{paths.push(`/items?ids=${itemId}`);tokens.push("oauth-access-token");return{id:itemId} as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(paths,["/products/MLB50181290","/products/MLB50181290/items","/items?ids=MLB4345564271"]);
  assert.deepEqual(tokens,["oauth-access-token","oauth-access-token","oauth-access-token"]);
});
