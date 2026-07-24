import test from "node:test";
import assert from "node:assert/strict";
import { runProductEnrichmentFlow } from "./product-enrichment-flow.ts";
import { suggestExistingCategory } from "./ai-product-assistant.ts";

test("importação completa dispara geração e aplicação uma vez", async (context) => {
  const generate = context.mock.fn(async () => ({ title: "Título comercial" }));
  const applied: string[] = [];
  const stages: string[] = [];
  await runProductEnrichmentFlow({
    importProduct: async () => ({ title: "Original", partial: false }),
    applyImported: (value) => applied.push(value.title),
    generateContent: generate,
    applyGenerated: (value) => applied.push(value.title),
    onStage: (stage) => stages.push(stage),
  });
  assert.equal(generate.mock.callCount(), 1);
  assert.deepEqual(applied, ["Original", "Título comercial"]);
  assert.deepEqual(stages, ["importing", "generating", "ready"]);
});

test("importação parcial também dispara geração uma vez", async (context) => {
  const generate = context.mock.fn(async () => ({ description: "Enriquecida" }));
  await runProductEnrichmentFlow({
    importProduct: async () => ({ title: "Parcial", warning: "parcial" }),
    applyImported: () => undefined,
    generateContent: generate,
    applyGenerated: () => undefined,
    onStage: () => undefined,
  });
  assert.equal(generate.mock.callCount(), 1);
});

test("falha total não dispara geração", async (context) => {
  const generate = context.mock.fn(async () => ({}));
  await assert.rejects(() => runProductEnrichmentFlow({
    importProduct: async () => { throw new Error("import failed"); },
    applyImported: () => undefined,
    generateContent: generate,
    applyGenerated: () => undefined,
    onStage: () => undefined,
  }));
  assert.equal(generate.mock.callCount(), 0);
});

test("erro da IA preserva os dados importados", async () => {
  const applied: string[] = [];
  await assert.rejects(() => runProductEnrichmentFlow({
    importProduct: async () => ({ title: "Importado" }),
    applyImported: (value) => applied.push(value.title),
    generateContent: async () => { throw new Error("AI failed"); },
    applyGenerated: () => applied.push("gerado"),
    onStage: () => undefined,
  }));
  assert.deepEqual(applied, ["Importado"]);
});

test("seleciona somente categoria existente e usa Geral em caso inseguro", () => {
  const categories = ["Geral", "Ferramentas", "Agro", "Automotivo", "Tecnologia", "Casa e Jardim"];
  assert.equal(suggestExistingCategory({ title: "Parafusadeira 20V", categories }), "Ferramentas");
  assert.equal(suggestExistingCategory({ title: "GPS rural de precisão", categories }), "Agro");
  assert.equal(suggestExistingCategory({ title: "Produto sem correspondência", categories }), "Geral");
  assert.equal(suggestExistingCategory({ title: "Furadeira", categories: ["Geral"] }), "Geral");
});
