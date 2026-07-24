import type { AIProductBlock, AIProductContent, AIProductInput } from "../types/ai-product-assistant.ts";

export interface AIProductProvider {
  readonly id: string;
  generate(input: AIProductInput): Promise<AIProductContent>;
}

const clean = (value: unknown, max = 500) => String(value ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const slug = (value: string) => normalized(value).replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 90).replace(/-+$/g, "");
const unique = (values: string[], max = 100) => [...new Map(values.map((value): [string, string] => [normalized(clean(value, max)), clean(value, max)]).filter(([key]) => Boolean(key))).values()];
const wholeText = (value: string, max: number) => value.length <= max ? value : value.slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[\s,;:–—-]+$/, "");
const usefulValue = (value: string) => {
  const text = clean(value, 180);
  return text.length > 1 && !/(?:\bde\s+[a-z]|\bmanusei)$/i.test(text) && !/[,:;/-]$/.test(text);
};

const categoryRules = [
  { category: "Ferramentas", terms: ["parafusadeira", "furadeira", "serra", "lixadeira", "ferramenta"] },
  { category: "Agro", terms: ["radio agricola", "pulverizador", "gps rural"] },
  { category: "Automotivo", terms: ["aspirador automotivo", "scanner obd", "camera de re"] },
  { category: "Tecnologia", terms: ["eletronico", "eletronicos", "audio", "informatica"] },
  { category: "Casa e Jardim", terms: ["limpeza domestica", "cozinha", "jardim"] },
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

const kindRules: Array<[RegExp, string]> = [
  [/\bparafusadeira\b.*\bfuradeira\b.*\bimpacto\b/i, "Parafusadeira e furadeira de impacto"],
  [/\bparafusadeira\b.*\bfuradeira\b/i, "Parafusadeira e furadeira"],
  [/\bparafusadeira\b/i, "Parafusadeira"],
  [/\bfuradeira\b.*\bimpacto\b/i, "Furadeira de impacto"],
  [/\bfuradeira\b/i, "Furadeira"],
  [/\blixadeira\b/i, "Lixadeira"],
  [/\bserra circular\b/i, "Serra circular"],
  [/\bserra\b/i, "Serra"],
  [/\bscanner obd\b/i, "Scanner OBD"],
  [/\baspirador\b/i, "Aspirador"],
  [/\bpulverizador\b/i, "Pulverizador"],
  [/\br[aá]dio\b/i, "Rádio"],
];
const typeFromTitle = (title: string) => kindRules.find(([pattern]) => pattern.test(title))?.[1]
  ?? wholeText(clean(title, 160).replace(/\b(?:oferta|promoção|original|novo|kit completo)\b/gi, " ").replace(/\s+/g, " ").trim(), 42);
const specKey = (name: string) => {
  const key = normalized(name);
  if (key.includes("modelo")) return "model";
  if (key.includes("torque")) return "torque";
  if (key.includes("mandril")) return "chuck";
  if (key.includes("bateria")) return "battery";
  if (key.includes("sem fio") || key.includes("alimentacao")) return "wireless";
  if (key.includes("luz") || key.includes("led")) return "led";
  if (key.includes("acessor") || key.includes("conteudo") || key.includes("embalagem") || key.includes("itens inclus")) return "package";
  if (key.includes("peso")) return "weight";
  if (key.includes("capacidade")) return "capacity";
  if (key.includes("potencia")) return "power";
  if (key.includes("dimens")) return "dimensions";
  if (key.includes("recurso") || key.includes("funcao")) return "feature";
  if (key.includes("voltagem") || key.includes("tensao")) return "voltage";
  if (key === "marca") return "brand";
  if (key === "linha") return "line";
  if (key === "cor") return "color";
  return "other";
};
const specPriority: Record<string, number> = { torque: 0, chuck: 1, wireless: 2, led: 3, package: 4, battery: 5, weight: 6, capacity: 7, power: 8, dimensions: 9, feature: 10, voltage: 20, model: 30, brand: 31, line: 32, color: 33, other: 40 };
type Specification = { name: string; value: string; key: string };
const titleAttribute = (item: Specification) => {
  if (item.key === "torque") return item.value;
  if (item.key === "chuck") return `mandril ${item.value}`;
  if (item.key === "wireless" && /\b(sim|sem fio|bateria)\b/i.test(item.value)) return "sem fio";
  if (item.key === "led" && !/\b(não|nao)\b/i.test(item.value)) return "com luz LED";
  if (item.key === "package" && /\bmaleta\b/i.test(item.value)) return "com maleta";
  if (["capacity", "power"].includes(item.key)) return item.value;
  return "";
};
const benefitFor = (item: Specification) => {
  if (item.key === "torque") return `Torque de ${item.value} para controlar a força durante o uso`;
  if (item.key === "chuck") return `Mandril de ${item.value}`;
  if (item.key === "wireless" && /\b(sim|sem fio|bateria)\b/i.test(item.value)) return "Funcionamento sem fio para maior liberdade de movimento";
  if (item.key === "led" && !/\b(não|nao)\b/i.test(item.value)) return "Luz LED integrada para iluminar a área de trabalho";
  if (item.key === "package") return `Acompanha ${item.value}`;
  if (item.key === "battery") return `Bateria informada: ${item.value}`;
  if (item.key === "weight") return `Peso informado de ${item.value}`;
  if (item.key === "capacity") return `Capacidade de ${item.value}`;
  if (item.key === "power") return `Potência de ${item.value}`;
  if (item.key === "dimensions") return `Dimensões informadas: ${item.value}`;
  if (item.key === "feature") return `${item.name}: ${item.value}`;
  return "";
};
const faqFor = (item: Specification) => {
  if (item.key === "wireless" && /\b(sim|sem fio|bateria)\b/i.test(item.value)) return { question: "Ela funciona sem fio?", answer: "Sim. O funcionamento sem fio está informado nas especificações do produto." };
  if (item.key === "torque") return { question: "Qual é o torque máximo?", answer: `O torque informado é ${item.value}.` };
  if (item.key === "chuck") return { question: "Qual é o tamanho do mandril?", answer: `O tamanho informado do mandril é ${item.value}.` };
  if (item.key === "package") return { question: "Quais acessórios acompanham o produto?", answer: `O conteúdo informado inclui ${item.value}.` };
  if (item.key === "power") return { question: "Qual é a potência informada?", answer: `A potência informada é ${item.value}.` };
  if (item.key === "capacity") return { question: "Qual é a capacidade informada?", answer: `A capacidade informada é ${item.value}.` };
  if (item.key === "dimensions") return { question: "Quais são as dimensões informadas?", answer: `As dimensões informadas são ${item.value}.` };
  return null;
};

export function hasApplicableAIContent(content: AIProductContent, block: AIProductBlock) {
  const specifications = Array.isArray(content.specifications) ? content.specifications : [];
  const keywords = Array.isArray(content.keywords) ? content.keywords : [];
  const benefits = Array.isArray(content.benefits) ? content.benefits : [];
  const faq = Array.isArray(content.faq) ? content.faq : [];
  const checks: Record<AIProductBlock, boolean> = {
    all: Boolean(content.title || content.shortDescription || content.description || content.brand || content.category || specifications.length || keywords.length),
    title: Boolean(content.title && content.slug),
    shortDescription: Boolean(content.shortDescription),
    description: Boolean(content.description),
    benefits: benefits.length > 0,
    faq: faq.length > 0,
    cta: Boolean(content.cta),
    seo: Boolean(content.metaTitle || content.metaDescription || content.openGraphDescription || keywords.length),
    identity: Boolean(content.brand || content.category),
    specifications: specifications.length > 0,
  };
  return checks[block];
}

export class TemplateProductProvider implements AIProductProvider {
  readonly id = "template";
  async generate(input: AIProductInput): Promise<AIProductContent> {
    const originalTitle = clean(input.title, 180) || "Produto";
    const brand = clean(input.brand, 60);
    const specifications: Specification[] = (input.specifications ?? [])
      .map((item) => ({ name: clean(item.name, 80), value: clean(item.value, 180), key: specKey(item.name) }))
      .filter((item) => item.name && usefulValue(item.value));
    const model = specifications.find((item) => item.key === "model" && /detalhado/i.test(item.name))?.value
      ?? specifications.find((item) => item.key === "model")?.value ?? "";
    const sorted = [...specifications].sort((a, b) => specPriority[a.key] - specPriority[b.key]);
    const titleParts = unique([typeFromTitle(originalTitle), brand, model, ...sorted.map(titleAttribute).filter(Boolean).slice(0, 2)], 80);
    const commercialTitle = wholeText(titleParts.join(" "), 90);
    const category = suggestExistingCategory(input);
    const functionalSpecifications = sorted.filter((item) => !["model", "brand", "line", "color", "voltage", "other"].includes(item.key));
    const benefits = unique(functionalSpecifications.map(benefitFor).filter(Boolean), 180);
    const featurePhrases = functionalSpecifications.slice(0, 3).map((item) => {
      if (item.key === "wireless") return "funcionamento sem fio";
      if (item.key === "led") return "luz LED integrada";
      return `${item.name.toLowerCase()} de ${item.value}`;
    });
    const identity = `${typeFromTitle(originalTitle)}${brand ? ` da ${brand}` : ""}${model ? `, modelo ${model}` : ""}`;
    const sentenceOne = `${identity}.`;
    const sentenceTwo = featurePhrases.length ? `Entre os recursos informados estão ${featurePhrases.join(", ").replace(/, ([^,]*)$/, " e $1")}.` : "";
    const sentenceThree = clean(input.description, 280);
    const shortDescription = wholeText([sentenceOne, sentenceTwo, sentenceThree].filter(Boolean).slice(0, 3).join(" "), 320);
    const faqByOrigin = new Map<string, { question: string; answer: string }>();
    for (const item of functionalSpecifications) {
      const faq = faqFor(item);
      if (faq && !faqByOrigin.has(item.key)) faqByOrigin.set(item.key, faq);
    }
    const faq = [...faqByOrigin.values()].slice(0, 5);
    const packageItems = specifications.filter((item) => item.key === "package");
    const ctaSubject = originalTitle.length <= 60 ? originalTitle : commercialTitle;
    const cta = `Confira os detalhes de ${ctaSubject} e consulte as condições disponíveis no site parceiro.`;
    const sections = [
      shortDescription,
      benefits.length ? `## Principais benefícios\n${benefits.map((item) => `- ${item}`).join("\n")}` : "",
      specifications.length ? `## Recursos e especificações\n${specifications.filter((item) => item.key !== "package").map((item) => `- **${item.name}:** ${item.value}`).join("\n")}` : "",
      packageItems.length ? `## Conteúdo informado da embalagem\n${packageItems.map((item) => `- ${item.value}`).join("\n")}` : "",
      faq.length ? `## Perguntas frequentes\n${faq.map((item) => `### ${item.question}\n${item.answer}`).join("\n\n")}` : "",
      `## Chamada para ação\n${cta}`,
    ].filter(Boolean);
    const seoAttribute = functionalSpecifications[0];
    const seoCore = unique([typeFromTitle(originalTitle), brand, model, seoAttribute?.value ?? ""], 80).join(" ");
    const keywords = unique([typeFromTitle(originalTitle), brand, model, category, ...functionalSpecifications.slice(0, 4).flatMap((item) => [item.name, item.value])], 80);
    return {
      title: commercialTitle, slug: slug(commercialTitle), brand, category, shortDescription,
      description: sections.join("\n\n"), benefits, faq, cta,
      metaTitle: wholeText(`${seoCore} | Ativa Hub`, 60),
      metaDescription: wholeText(`${identity}${seoAttribute ? ` com ${seoAttribute.name.toLowerCase()} de ${seoAttribute.value}` : ""}. Confira detalhes e especificações.`, 160),
      openGraphDescription: wholeText(shortDescription, 200), keywords,
      specifications: specifications.map(({ name, value }) => ({ name, value })), provider: "template",
    };
  }
}

export const defaultAIProductProvider: AIProductProvider = new TemplateProductProvider();
