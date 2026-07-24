import test from "node:test";
import assert from "node:assert/strict";
import { hasApplicableAIContent, suggestExistingCategory, TemplateProductProvider } from "./ai-product-assistant.ts";
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
  assert.equal(content.slug, "furadeira-de-impacto-marca-x-500-w");
  assert.ok(content.description.includes("## Principais benefícios"));
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
  assert.ok(sections.some((section) => section.title === "Principais benefícios"));
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

test("título comercial usa marca, modelo e atributos sem truncar palavras", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "PARAFUSADEIRA FURADEIRA IMPACTO SUPER OFERTA ORIGINAL KIT COMPLETO",
    brand: "WAP",
    specifications: [
      { name: "Modelo", value: "K21" },
      { name: "Modelo detalhado", value: "K21 ID03" },
      { name: "Torque máximo", value: "60 Nm" },
      { name: "Alimentação", value: "Sem fio" },
      { name: "Acessórios", value: "Maleta" },
    ],
  });
  assert.equal(content.title, "Parafusadeira e furadeira de impacto WAP K21 ID03 60 Nm sem fio");
  assert.ok(content.title.length <= 90);
  assert.equal(/\b(?:Clipe de c|manusei)\b/i.test(content.title), false);
});

test("descrição é natural, estruturada e não começa com frases proibidas", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Parafusadeira e furadeira",
    brand: "WAP",
    specifications: [
      { name: "Torque máximo", value: "60 Nm" },
      { name: "Luz LED", value: "Sim" },
      { name: "Conteúdo da embalagem", value: "Maleta e carregador" },
    ],
  });
  assert.doesNotMatch(content.shortDescription, /^(reúne modelo|foi selecionado|para quem busca)/i);
  assert.match(content.description, /## Principais benefícios/);
  assert.match(content.description, /## Recursos e especificações/);
  assert.match(content.description, /## Conteúdo informado da embalagem/);
  assert.match(content.description, /## Perguntas frequentes/);
  assert.match(content.description, /## Chamada para ação/);
});

test("modelo e modelo detalhado não viram benefícios nem duplicam FAQ", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Furadeira",
    specifications: [
      { name: "Modelo", value: "K21" },
      { name: "Modelo detalhado", value: "K21 ID03" },
      { name: "Torque", value: "60 Nm" },
      { name: "Torque máximo", value: "60 Nm" },
    ],
  });
  assert.equal(content.benefits.some((item) => /modelo/i.test(item)), false);
  assert.equal(new Set(content.faq.map((item) => item.question)).size, content.faq.length);
  assert.equal(content.faq.filter((item) => /torque/i.test(item.question)).length, 1);
});

test("descarta especificações incompletas dos benefícios", async () => {
  const content = await new TemplateProductProvider().generate({
    title: "Parafusadeira",
    specifications: [
      { name: "Acessórios", value: "Clipe de c" },
      { name: "Peso", value: "manusei" },
      { name: "Mandril", value: "13 mm" },
    ],
  });
  assert.equal(content.benefits.some((item) => /Clipe de c|manusei/i.test(item)), false);
  assert.ok(content.benefits.some((item) => /13 mm/i.test(item)));
});

test("conteúdo aplicável define sucesso e resposta vazia define erro", () => {
  const valid = {
    title: "Título", slug: "titulo", brand: "", category: "", shortDescription: "", description: "",
    benefits: [], faq: [], cta: "", metaTitle: "", metaDescription: "", openGraphDescription: "",
    keywords: [], specifications: [], provider: "template" as const,
  };
  const empty = { ...valid, title: "", slug: "" };
  assert.equal(hasApplicableAIContent(valid, "all"), true);
  assert.equal(hasApplicableAIContent(empty, "all"), false);
  assert.equal(hasApplicableAIContent(empty, "benefits"), false);
});
