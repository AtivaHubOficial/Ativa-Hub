import type { AIProductContent, AIProductInput } from "../types/ai-product-assistant.ts";

export interface AIProductProvider {
  readonly id: string;
  generate(input: AIProductInput): Promise<AIProductContent>;
}

const clean = (value: unknown, max = 500) => String(value ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 90).replace(/-+$/g, "");
const unique = (values: string[]) => [...new Set(values.map((value) => clean(value, 60)).filter(Boolean))];

export class TemplateProductProvider implements AIProductProvider {
  readonly id = "template";
  async generate(input: AIProductInput): Promise<AIProductContent> {
    const baseTitle = clean(input.title, 100) || "Produto selecionado";
    const brand = clean(input.brand, 60);
    const commercialTitle = clean(`${baseTitle}${brand && !baseTitle.toLowerCase().includes(brand.toLowerCase()) ? ` — ${brand}` : ""}`, 70);
    const availableCategories = (input.categories ?? []).map((item) => clean(item, 80)).filter(Boolean);
    const requestedCategory = clean(input.category, 80);
    const category = availableCategories.find((item) => item.toLowerCase() === requestedCategory.toLowerCase()) ??
      availableCategories.find((item) => baseTitle.toLowerCase().includes(item.toLowerCase())) ??
      (requestedCategory || availableCategories[0] || "Geral");
    const specifications = (input.specifications ?? []).map((item) => ({ name: clean(item.name, 80), value: clean(item.value, 160) })).filter((item) => item.name && item.value);
    const benefits = unique([
      specifications[0] ? `${specifications[0].name}: ${specifications[0].value}` : "Escolha prática para o dia a dia",
      specifications[1] ? `${specifications[1].name}: ${specifications[1].value}` : "Informações organizadas para facilitar sua decisão",
      brand ? `Qualidade associada à marca ${brand}` : "Produto selecionado para facilitar sua compra",
    ]);
    const shortDescription = clean(`${commercialTitle}: conheça os principais detalhes, benefícios e especificações antes de comprar no site parceiro.`, 160);
    const sourceDescription = clean(input.description, 1200);
    const cta = `Confira preço, disponibilidade e condições atuais de ${commercialTitle} no site parceiro.`;
    const faq = [
      { question: "Este produto está disponível?", answer: "Preço e disponibilidade são confirmados diretamente no site parceiro no momento da compra." },
      { question: "Como conferir todos os detalhes?", answer: "Revise as especificações desta página e consulte as condições atualizadas no site parceiro." },
    ];
    const description = [
      sourceDescription || `${commercialTitle} foi selecionado para quem busca uma opção prática e bem apresentada.`,
      "", "## Benefícios", ...benefits.map((item) => `- ${item}`),
      "", "## Perguntas frequentes", ...faq.flatMap((item) => [`### ${item.question}`, item.answer, ""]),
      "## Chamada para ação", cta,
    ].join("\n").trim();
    const keywords = unique([baseTitle, brand, category, ...specifications.slice(0, 3).map((item) => item.name)]);
    return {
      title: commercialTitle, slug: slug(commercialTitle), brand, category, shortDescription, description,
      benefits, faq, cta, metaTitle: clean(`${commercialTitle} | Ativa Hub`, 60),
      metaDescription: shortDescription.slice(0, 160), openGraphDescription: shortDescription.slice(0, 200),
      keywords, specifications, provider: "template",
    };
  }
}

export const defaultAIProductProvider: AIProductProvider = new TemplateProductProvider();
