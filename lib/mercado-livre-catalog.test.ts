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

test("prioriza a oferta explícita e consulta catálogo e item",async()=>{
  const requests:Array<{path:string;accessToken:string;optional404:boolean|undefined}>=[];
  const result=await resolveCatalogProduct("MLB50181290","MLB4345564271","oauth-access-token",async<T>(path:string,accessToken:string,optional404?:boolean)=>{requests.push({path,accessToken,optional404});return(path.startsWith("/products/")?{id:"MLB50181290"}:{id:"MLB4345564271"}) as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(requests,[
    {path:"/products/MLB50181290",accessToken:"oauth-access-token",optional404:undefined},
    {path:"/items/MLB4345564271",accessToken:"oauth-access-token",optional404:true},
  ]);
});

test("descobre oferta oficial quando a URL contém somente productId",async()=>{
  const paths:string[]=[];
  const tokens:string[]=[];
  const result=await resolveCatalogProduct<{id:string}>("MLB50181290",null,"oauth-access-token",async<T>(path:string,accessToken:string)=>{paths.push(path);tokens.push(accessToken);if(path.endsWith("/items"))return{results:[{item_id:"MLB4345564271"}]} as T;return{id:path.includes("/products/")?"MLB50181290":"MLB4345564271"} as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(paths,["/products/MLB50181290","/products/MLB50181290/items","/items/MLB4345564271"]);
  assert.deepEqual(tokens,["oauth-access-token","oauth-access-token","oauth-access-token"]);
});
