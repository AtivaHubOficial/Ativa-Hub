import test from "node:test";
import assert from "node:assert/strict";
import { TemplateProductProvider } from "./ai-product-assistant.ts";
import { parseProductDescription } from "./product-description.ts";

test("gera pacote comercial completo sem HTML executável", async () => {
  const provider = new TemplateProductProvider();
  const content = await provider.generate({
    title: "<script>alert(1)</script> Furadeira de impacto",
    brand: "Marca X",
    category: "Ferramentas",
    categories: ["Geral", "Ferramentas"],
    description: "<b>Potência para seus projetos</b>",
    specifications: [{ name: "Potência", value: "500 W" }],
  });
  assert.equal(content.title.includes("<script>"), false);
  assert.equal(content.category, "Ferramentas");
  assert.equal(content.slug, "furadeira-de-impacto-marca-x");
  assert.ok(content.description.includes("## Benefícios"));
  assert.ok(content.description.includes("## Perguntas frequentes"));
  assert.ok(content.keywords.includes("Ferramentas"));
  assert.equal(content.metaTitle.length <= 60, true);
  assert.equal(content.metaDescription.length <= 160, true);
});

test("descrição Markdown gerada é convertida em seções seguras", async () => {
  const content = await new TemplateProductProvider().generate({ title: "Produto teste" });
  const sections = parseProductDescription(content.description);
  assert.ok(sections.some((section) => section.title === "Benefícios"));
  assert.ok(sections.some((section) => section.title === "Perguntas frequentes"));
  assert.ok(sections.some((section) => section.title === "Chamada para ação"));
});
