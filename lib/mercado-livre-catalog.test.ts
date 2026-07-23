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
  const result=await resolveCatalogProduct<{id:string}>("MLB50181290",null,"oauth-access-token",async<T>(path:string,accessToken:string)=>{paths.push(path);tokens.push(accessToken);if(path.endsWith("/items"))return{results:[{item_id:"MLB4345564271"}]} as T;return{id:"MLB50181290"} as T},async<T>(itemId:string)=>{paths.push(`/items/${itemId}`);tokens.push("oauth-access-token");return{id:itemId} as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(paths,["/products/MLB50181290","/products/MLB50181290/items","/items/MLB4345564271"]);
  assert.deepEqual(tokens,["oauth-access-token","oauth-access-token","oauth-access-token"]);
});

test("mantém dados de catálogo quando a oferta retorna 403 e não repete /items",async()=>{
  const paths:string[]=[];
  const result=await resolveCatalogProduct<{id:string}>("MLB50181290","MLB4345564271","token",async<T>(path:string)=>{paths.push(path);if(path.endsWith("/items"))return{results:[{item_id:"MLB4345564271",price:99}]} as T;return{id:"MLB50181290",name:"Produto",pictures:[{url:"https://img.test/1.jpg"}]} as T},async<T>(itemId:string)=>{paths.push(`/items/${itemId}`);return undefined as T|undefined});
  assert.equal(result.item,undefined);
  assert.equal(result.offer?.price,99);
  assert.equal(paths.filter(path=>path.startsWith("/items/")).length,1);
});
