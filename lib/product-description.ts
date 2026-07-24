export type ProductDetails = {
  features?: string[];
  benefits?: string[];
  specifications?: Record<string, string>;
  includedItems?: string[];
  additionalInformation?: string[];
};

export type DescriptionSection = { title: string; paragraphs: string[]; items: string[]; entries: Array<[string, string]> };
import { sanitizeProductDescription } from "@/lib/safe-description";

const headings: Record<string, string> = {
  caracteristicas: "Características", beneficios: "Benefícios", especificacoes: "Especificações técnicas",
  "especificacoes tecnicas": "Especificações técnicas", "itens inclusos": "Itens inclusos",
  "conteudo da embalagem": "Conteúdo da embalagem", "informacoes adicionais": "Informações adicionais",
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/:$/, "").trim();

export function parseProductDescription(description: string): DescriptionSection[] {
  const lines = sanitizeProductDescription(description).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sections: DescriptionSection[] = [{ title: "Descrição", paragraphs: [], items: [], entries: [] }];
  for (const line of lines) {
    const heading = headings[normalize(line)];
    if (heading) { sections.push({ title: heading, paragraphs: [], items: [], entries: [] }); continue; }
    const section = sections[sections.length - 1];
    const list = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    const pair = line.match(/^([^:]{2,50}):\s+(.+)$/);
    if (list) section.items.push(list[1]);
    else if (pair) section.entries.push([pair[1], pair[2]]);
    else section.paragraphs.push(line);
  }
  return sections.filter((section) => section.paragraphs.length || section.items.length || section.entries.length);
}
