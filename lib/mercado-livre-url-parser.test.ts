import assert from "node:assert/strict";
import test from "node:test";
import {MercadoLivreUrlParserError,parseMercadoLivreUrl} from "./mercado-livre-url-parser.ts";

const catalog={catalogDetected:true,productId:"MLB50181290",userProductId:null,itemId:null};
test("reconhece catálogo moderno no último segmento",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-exemplo/MLB50181290"),catalog));
test("ignora barra final e rastreamento",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-exemplo/MLB50181290/?utm_source=test"),catalog));
test("preserva catálogo no formato /p/",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/p/MLB50181290"),catalog));
test("reconhece User Product e extrai wid do hash",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/pistola-de-pulverizacao-eletrica-para-pintura-pulverizadora/up/MLBU3437902526?pdp_filters=seller_id%3A594550826#polycard_client=recommendations_vip-seller_items-above&wid=MLB4214733159&sid=recos"),{catalogDetected:false,productId:null,userProductId:"MLBU3437902526",itemId:"MLB4214733159"}));
test("preserva User Product sem inventar ITEM_ID",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto/up/MLBU3437902526"),{catalogDetected:false,productId:null,userProductId:"MLBU3437902526",itemId:null}));
test("mantém productId e extrai a oferta de pdp_filters",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto/p/MLB50181290?pdp_filters=item_id:MLB4345564271"),{catalogDetected:true,productId:"MLB50181290",userProductId:null,itemId:"MLB4345564271"}));
test("mantém productId e extrai a oferta de wid",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/p/MLB50181290?wid=MLB4345564271"),{catalogDetected:true,productId:"MLB50181290",userProductId:null,itemId:"MLB4345564271"}));
test("preserva anúncio tradicional",()=>assert.deepEqual(parseMercadoLivreUrl("https://produto.mercadolivre.com.br/MLB-5018129000-produto-exemplo"),{catalogDetected:false,productId:null,userProductId:null,itemId:"MLB5018129000"}));
test("rejeita URL sem identificador",()=>assert.throws(()=>parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-sem-identificador"),(error:unknown)=>error instanceof MercadoLivreUrlParserError&&error.code==="ITEM_ID_NOT_FOUND"));
test("não aceita MLB dentro de outro texto",()=>assert.throws(()=>parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto/ABCMLB50181290XYZ"),(error:unknown)=>error instanceof MercadoLivreUrlParserError&&error.code==="ITEM_ID_NOT_FOUND"));
