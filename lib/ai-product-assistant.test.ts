import test from "node:test";
import assert from "node:assert/strict";
import { suggestExistingCategory, TemplateProductProvider } from "./ai-product-assistant.ts";
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
  const content = await new TemplateProductProvider().generate({
    title: "Produto teste",
    specifications: [{ name: "Potência", value: "500 W" }],
  });
  const sections = parseProductDescription(content.description);
  assert.ok(sections.some((section) => section.title === "Benefícios"));
  assert.ok(sections.some((section) => section.title === "Perguntas frequentes"));
  assert.ok(sections.some((section) => section.title === "Chamada para ação"));
});

test("não usa frases genéricas proibidas nem inventa informações ausentes", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Parafusadeira Compacta",
    brand: "Oficina",
    specifications: [{ name: "Torque", value: "35 Nm" }],
  });
  const generated = JSON.stringify(content).toLowerCase();
  assert.equal(generated.includes("foi selecionado para quem busca"), false);
  assert.equal(generated.includes("escolha prática para o dia a dia"), false);
  assert.equal(generated.includes("qualidade associada"), false);
  assert.equal(generated.includes("garantia"), false);
  assert.equal(generated.includes("compatível"), false);
});

test("deriva benefícios das especificações e ignora Marca, Linha e Qualidade", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Furadeira XP",
    specifications: [
      { name: "Marca", value: "Exemplo" },
      { name: "Linha", value: "Pro" },
      { name: "Potência", value: "650 W" },
      { name: "Bateria", value: "20 V" },
      { name: "Acessórios", value: "maleta e brocas" },
    ],
  });
  assert.ok(content.benefits.some((item) => item.includes("650 W")));
  assert.ok(content.benefits.some((item) => item.includes("20 V")));
  assert.ok(content.benefits.some((item) => item.includes("maleta e brocas")));
  assert.equal(content.benefits.some((item) => /^(Marca|Linha|Qualidade):/i.test(item)), false);
});

test("FAQ contém somente perguntas sustentadas pelos dados conhecidos", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Serra Circular",
    specifications: [
      { name: "Potência", value: "1.200 W" },
      { name: "Dimensões", value: "30 x 20 cm" },
    ],
  });
  assert.equal(content.faq.length, 2);
  assert.ok(content.faq.some((item) => item.answer.includes("1.200 W")));
  assert.ok(content.faq.some((item) => item.answer.includes("30 x 20 cm")));
  assert.equal(content.faq.some((item) => /garantia|compatibilidade|disponível/i.test(`${item.question} ${item.answer}`)), false);
});

test("CTA não promete estoque, entrega, desconto ou melhor preço", async () => {
  const content = await new TemplateProductProvider().generate({ title: "Scanner OBD Pro" });
  assert.equal(/estoque|entrega|desconto|melhor preço|disponibilidade/i.test(content.cta), false);
  assert.ok(content.cta.includes("Scanner OBD Pro"));
});

test("SEO inclui modelo e atributo verificável respeitando os limites", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Parafusadeira",
    brand: "Makita",
    specifications: [
      { name: "Modelo", value: "XPT-20" },
      { name: "Torque", value: "42 Nm" },
    ],
  });
  assert.match(content.metaTitle, /Makita/);
  assert.match(content.metaTitle, /XPT-20/);
  assert.match(content.metaTitle, /42 Nm/);
  assert.match(content.metaDescription, /XPT-20/);
  assert.match(content.metaDescription, /42 Nm/i);
  assert.ok(content.metaTitle.length <= 60);
  assert.ok(content.metaDescription.length <= 160);
});

test("categoria considera marca, descrição e especificações, mas nunca cria categoria", () => {
  const categories = ["Geral", "Ferramentas", "Agro"];
  assert.equal(suggestExistingCategory({
    title: "Equipamento profissional",
    description: "Indicado para trabalhos com furadeira",
    categories,
  }), "Ferramentas");
  assert.equal(suggestExistingCategory({
    title: "Equipamento rural",
    specifications: [{ name: "Uso", value: "pulverizador" }],
    categories,
  }), "Agro");
  assert.equal(suggestExistingCategory({ title: "Scanner OBD", categories }), "Geral");
});
