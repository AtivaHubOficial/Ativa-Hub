import assert from "node:assert/strict";
import test from "node:test";
import {MercadoLivreUrlParserError,parseMercadoLivreUrl} from "./mercado-livre-url-parser.ts";

const catalog={catalogDetected:true,productId:"MLB50181290",itemId:null};
test("reconhece catálogo moderno no último segmento",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-exemplo/MLB50181290"),catalog));
test("ignora barra final e rastreamento",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-exemplo/MLB50181290/?utm_source=test"),catalog));
test("preserva catálogo no formato /p/",()=>assert.deepEqual(parseMercadoLivreUrl("https://www.mercadolivre.com.br/p/MLB50181290"),catalog));
test("preserva anúncio tradicional",()=>assert.deepEqual(parseMercadoLivreUrl("https://produto.mercadolivre.com.br/MLB-5018129000-produto-exemplo"),{catalogDetected:false,productId:null,itemId:"MLB5018129000"}));
test("rejeita URL sem identificador",()=>assert.throws(()=>parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto-sem-identificador"),(error:unknown)=>error instanceof MercadoLivreUrlParserError&&error.code==="ITEM_ID_NOT_FOUND"));
test("não aceita MLB dentro de outro texto",()=>assert.throws(()=>parseMercadoLivreUrl("https://www.mercadolivre.com.br/produto/ABCMLB50181290XYZ"),(error:unknown)=>error instanceof MercadoLivreUrlParserError&&error.code==="ITEM_ID_NOT_FOUND"));
