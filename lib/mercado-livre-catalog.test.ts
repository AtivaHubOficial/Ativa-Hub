import assert from "node:assert/strict";
import test from "node:test";
import {resolveCatalogProduct} from "./mercado-livre-catalog.ts";

test("prioriza a oferta explícita e consulta catálogo e item",async()=>{
  const paths:string[]=[];
  const result=await resolveCatalogProduct("MLB50181290","MLB4345564271",async<T>(path:string)=>{paths.push(path);return(path.startsWith("/products/")?{id:"MLB50181290"}:{id:"MLB4345564271"}) as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(paths,["/products/MLB50181290","/items/MLB4345564271"]);
});

test("descobre oferta oficial quando a URL contém somente productId",async()=>{
  const paths:string[]=[];
  const result=await resolveCatalogProduct<{id:string}>("MLB50181290",null,async<T>(path:string)=>{paths.push(path);if(path.endsWith("/items"))return{results:[{item_id:"MLB4345564271"}]} as T;return{id:path.includes("/products/")?"MLB50181290":"MLB4345564271"} as T});
  assert.equal(result.itemId,"MLB4345564271");
  assert.deepEqual(paths,["/products/MLB50181290","/products/MLB50181290/items","/items/MLB4345564271"]);
});
