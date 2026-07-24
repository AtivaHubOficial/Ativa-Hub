import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectProductSource, PRODUCT_SOURCE_CAPABILITIES, productSourceAction, productSourceMessage } from "./product-source-capabilities.ts";

test("reconhece somente hosts oficiais importáveis",()=>{
  assert.equal(detectProductSource("https://www.mercadolivre.com.br/produto/MLB1"),"mercado_livre");
  assert.equal(detectProductSource("https://produto.mercadolivre.com.br/MLB-1"),"mercado_livre");
  assert.equal(detectProductSource("https://app.logzz.com.br/products/1"),"logzz");
  assert.equal(PRODUCT_SOURCE_CAPABILITIES.mercado_livre.importSupported,true);
  assert.equal(PRODUCT_SOURCE_CAPABILITIES.logzz.importSupported,true);
});
test("reconhece parceiros planejados sem torná-los importáveis",()=>{
  for(const [url,source] of [
    ["https://www.shopee.com.br/item","shopee"],["https://www.amazon.com.br/item","amazon"],["https://www.magazineluiza.com.br/item","magalu"],
  ] as const){
    assert.equal(detectProductSource(url),source);
    assert.equal(PRODUCT_SOURCE_CAPABILITIES[source].importSupported,false);
    assert.equal(productSourceAction(source),"manual");
    assert.match(productSourceMessage(source),new RegExp(PRODUCT_SOURCE_CAPABILITIES[source].name));
  }
});
test("domínios desconhecidos e falsos não recebem correspondência parcial",()=>{
  assert.equal(detectProductSource("https://example.com/item"),"unsupported");
  assert.equal(detectProductSource("https://shopee.com.br.evil.example/item"),"unsupported");
  assert.equal(detectProductSource("https://mercadolivre.com.br.evil.example/item"),"unsupported");
  assert.equal(productSourceMessage("unsupported"),"Este endereço não pertence a uma fonte compatível.");
});
test("URL insegura ou inválida recebe mensagem neutra",()=>{
  for(const url of ["not-a-url","http://amazon.com.br/item","https://user:pass@amazon.com.br/item","https://localhost/item","https://127.0.0.1/item"])assert.equal(detectProductSource(url),"invalid");
  assert.equal(productSourceMessage("invalid"),"Informe uma URL HTTPS válida.");
});
test("fonte planejada não chama importador nem IA e cadastro manual permanece disponível",()=>{
  for(const source of ["amazon","shopee","magalu"] as const)assert.equal(productSourceAction(source),"manual");
  const component=readFileSync(new URL("../components/admin/products/SmartImporter.tsx",import.meta.url),"utf8");
  assert.match(component,/if\(action==="manual"\)/);
  assert.match(component,/cadastro manual permanece disponível/i);
  assert.match(component,/if\(action==="logzz_import"\).*importar-logzz/s);
});
test("painel e cadastro usam a mesma configuração central",()=>{
  const partners=readFileSync(new URL("./partner-diagnostics.ts",import.meta.url),"utf8");
  const importer=readFileSync(new URL("../components/admin/products/SmartImporter.tsx",import.meta.url),"utf8");
  assert.match(partners,/PRODUCT_SOURCE_CAPABILITIES/);
  assert.match(importer,/PRODUCT_SOURCE_CAPABILITIES/);
});
