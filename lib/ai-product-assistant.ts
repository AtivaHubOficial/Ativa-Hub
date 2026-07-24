import type { AIProductContent, AIProductInput } from "../types/ai-product-assistant.ts";

export interface AIProductProvider {
  readonly id: string;
  generate(input: AIProductInput): Promise<AIProductContent>;
}

const clean = (value: unknown, max = 500) => String(value ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 90).replace(/-+$/g, "");
const unique = (values: string[]) => [...new Set(values.map((value) => clean(value, 60)).filter(Boolean))];
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const genericSpecificationNames = new Set(["marca", "linha", "qualidade"]);
const prioritySpecificationTerms = ["modelo", "torque", "potencia", "voltagem", "tensao", "bateria", "autonomia", "acessorio", "dimens", "peso", "capacidade", "velocidade", "recurso", "funcao", "uso"];
const categoryRules: Array<{ category: string; terms: string[] }> = [
  { category: "Ferramentas", terms: ["parafusadeira","furadeira","serra","lixadeira","ferramenta"] },
  { category: "Agro", terms: ["radio agricola","pulverizador","gps rural"] },
  { category: "Automotivo", terms: ["aspirador automotivo","scanner obd","camera de re"] },
  { category: "Tecnologia", terms: ["eletronico","eletronicos","audio","informatica"] },
  { category: "Casa e Jardim", terms: ["limpeza domestica","cozinha","jardim"] },
];

export function suggestExistingCategory(input: AIProductInput) {
  const categories = (input.categories ?? []).map((item) => clean(item, 80)).filter(Boolean);
  const requested = clean(input.category, 80);
  const exact = categories.find((item) => normalized(item) === normalized(requested));
  if (exact) return exact;
  const specificationText = (input.specifications ?? []).map((item) => `${item.name} ${item.value}`).join(" ");
  const searchable = normalized(`${input.title} ${input.brand ?? ""} ${input.description ?? ""} ${specificationText}`);
  for (const rule of categoryRules) {
    if (rule.terms.some((term) => searchable.includes(term))) {
      const existing = categories.find((item) => normalized(item) === normalized(rule.category));
      if (existing) return existing;
    }
  }
  return categories.find((item) => normalized(item) === "geral") ?? "";
}

const specificationPriority = (name: string) => {
  const normalizedName = normalized(name);
  const index = prioritySpecificationTerms.findIndex((term) => normalizedName.includes(term));
  return index === -1 ? prioritySpecificationTerms.length : index;
};

const naturalList = (items: string[]) => items.length < 2 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;

const describeSpecification = (name: string, value: string) => {
  const key = normalized(name);
  if (key.includes("torque")) return `Torque de ${value} para os usos indicados nas especificações`;
  if (key.includes("potencia")) return `Potência de ${value}`;
  if (key.includes("bateria") || key.includes("autonomia")) return `${name} de ${value}`;
  if (key.includes("acessorio")) return `Acompanha ${value}`;
  if (key.includes("dimens") || key.includes("peso")) return `${name}: ${value}, facilitando a avaliação do espaço e do manuseio`;
  if (key.includes("capacidade") || key.includes("velocidade") || key.includes("recurso") || key.includes("funcao")) return `${name}: ${value}`;
  if (key.includes("uso") || key.includes("aplicacao")) return `Indicado para ${value}`;
  return `${name}: ${value}`;
};

const faqForSpecification = (name: string, value: string) => {
  const key = normalized(name);
  if (key.includes("modelo")) return { question: "Qual é o modelo deste produto?", answer: `O modelo informado é ${value}.` };
  if (key.includes("torque")) return { question: "Qual é o torque informado?", answer: `O torque informado é ${value}.` };
  if (key.includes("potencia")) return { question: "Qual é a potência deste produto?", answer: `A potência informada é ${value}.` };
  if (key.includes("bateria")) return { question: "Quais são as informações da bateria?", answer: `A especificação de bateria informada é: ${value}.` };
  if (key.includes("acessorio")) return { question: "Quais acessórios estão informados?", answer: `Os acessórios informados são: ${value}.` };
  if (key.includes("dimens")) return { question: "Quais são as dimensões do produto?", answer: `As dimensões informadas são ${value}.` };
  if (key.includes("capacidade")) return { question: "Qual é a capacidade informada?", answer: `A capacidade informada é ${value}.` };
  return null;
};

export class TemplateProductProvider implements AIProductProvider {
  readonly id = "template";
  async generate(input: AIProductInput): Promise<AIProductContent> {
    const baseTitle = clean(input.title, 100) || "Produto selecionado";
    const brand = clean(input.brand, 60);
    const commercialTitle = clean(`${baseTitle}${brand && !normalized(baseTitle).includes(normalized(brand)) ? ` — ${brand}` : ""}`, 70);
    const category = suggestExistingCategory(input);
    const specifications = (input.specifications ?? []).map((item) => ({ name: clean(item.name, 80), value: clean(item.value, 160) })).filter((item) => item.name && item.value);
    const usefulSpecifications = specifications
      .filter((item) => !genericSpecificationNames.has(normalized(item.name)))
      .sort((left, right) => specificationPriority(left.name) - specificationPriority(right.name));
    const benefits = unique(usefulSpecifications.slice(0, 6).map((item) => describeSpecification(item.name, item.value)));
    const highlights = usefulSpecifications.slice(0, 3).map((item) => `${item.name.toLowerCase()} ${item.value}`);
    const opening = highlights.length
      ? `${commercialTitle} reúne ${naturalList(highlights)}.`
      : `${commercialTitle}${brand ? ` é um produto da ${brand}` : ""}.`;
    const shortDescription = clean(opening, 160);
    const sourceDescription = clean(input.description, 1200);
    const cta = `Conheça os detalhes de ${commercialTitle} e avalie suas especificações no site parceiro.`;
    const faq = usefulSpecifications.map((item) => faqForSpecification(item.name, item.value)).filter((item): item is { question: string; answer: string } => Boolean(item)).slice(0, 5);
    const description = [
      opening, sourceDescription ? `\n${sourceDescription}` : "",
      "", "## Benefícios", ...benefits.map((item) => `- ${item}`),
      "", "## Perguntas frequentes", ...faq.flatMap((item) => [`### ${item.question}`, item.answer, ""]),
      "## Chamada para ação", cta,
    ].join("\n").trim();
    const model = specifications.find((item) => normalized(item.name).includes("modelo"))?.value ?? "";
    const seoAttribute = usefulSpecifications.find((item) => !normalized(item.name).includes("modelo"));
    const seoAttributeText = seoAttribute ? `${seoAttribute.name} ${seoAttribute.value}` : "";
    const seoCore = unique([baseTitle, brand, model, seoAttributeText]).join(" ");
    const keywords = unique([baseTitle, brand, model, category, ...usefulSpecifications.slice(0, 4).flatMap((item) => [item.name, item.value])]);
    const metaTitle = clean(`${seoCore} | Ativa Hub`, 60);
    const metaDescription = clean(`${commercialTitle}${model && !normalized(commercialTitle).includes(normalized(model)) ? `, modelo ${model}` : ""}${seoAttributeText ? `, com ${seoAttributeText.toLowerCase()}` : ""}. Consulte detalhes e especificações.`, 160);
    return {
      title: commercialTitle, slug: slug(commercialTitle), brand, category, shortDescription, description,
      benefits, faq, cta, metaTitle,
      metaDescription, openGraphDescription: clean(opening, 200),
      keywords, specifications, provider: "template",
    };
  }
}

export const defaultAIProductProvider: AIProductProvider = new TemplateProductProvider();
