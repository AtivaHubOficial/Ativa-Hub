export const DELETE_ALL_PHRASE = "EXCLUIR TODOS";
export const DELETE_SOURCE_PHRASE = "EXCLUIR ORIGEM";
export const ALLOWED_PRODUCT_SOURCES = ["manual", "logzz", "mercado_livre"] as const;
export type AllowedProductSource = typeof ALLOWED_PRODUCT_SOURCES[number];
export const CATALOG_DELETION_SCOPE = {
  deletedTable: "products",
  preservedTables: ["categories", "platform_settings", "admin_users"] as const,
};

export function validProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string =>
    typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id),
  ))].slice(0, 500);
}

export function canDeleteAll(phrase: unknown): boolean {
  return phrase === DELETE_ALL_PHRASE;
}

export function canDeleteSource(source: unknown, phrase: unknown): source is AllowedProductSource {
  return ALLOWED_PRODUCT_SOURCES.includes(source as AllowedProductSource) &&
    phrase === DELETE_SOURCE_PHRASE;
}

export function normalizeExternalUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => url.searchParams.delete(key));
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export type DuplicateProduct = {
  id: string;
  title: string;
  source?: string | null;
  external_product_id?: string | null;
  external_offer_id?: string | null;
  affiliate_url?: string | null;
  image_url?: string | null;
  price?: number | string | null;
};

const normalizedTitle = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function duplicateReasons(first: DuplicateProduct, second: DuplicateProduct): string[] {
  const reasons: string[] = [];
  if (
    first.source && first.source === second.source &&
    first.external_product_id && first.external_product_id === second.external_product_id &&
    (first.external_offer_id ?? "") === (second.external_offer_id ?? "")
  ) reasons.push("Mesmo identificador externo");
  const firstUrl = normalizeExternalUrl(first.affiliate_url);
  if (firstUrl && firstUrl === normalizeExternalUrl(second.affiliate_url)) reasons.push("Mesma URL externa");
  if (normalizedTitle(first.title) === normalizedTitle(second.title)) reasons.push("Mesmo título normalizado");
  if (first.image_url && first.image_url === second.image_url) reasons.push("Mesma imagem principal");
  if (Number(first.price) > 0 && Number(first.price) === Number(second.price)) reasons.push("Mesmo preço");
  return reasons;
}

export function findPossibleDuplicates(products: DuplicateProduct[]) {
  const groups: Array<{ products: DuplicateProduct[]; reasons: string[] }> = [];
  const consumed = new Set<string>();
  for (let index = 0; index < products.length; index++) {
    if (consumed.has(products[index].id)) continue;
    const matches = [products[index]];
    const reasons = new Set<string>();
    for (let next = index + 1; next < products.length; next++) {
      const pairReasons = duplicateReasons(products[index], products[next]);
      const strong = pairReasons.includes("Mesmo identificador externo") ||
        pairReasons.includes("Mesma URL externa") ||
        pairReasons.includes("Mesma imagem principal") ||
        (pairReasons.includes("Mesmo título normalizado") && pairReasons.includes("Mesmo preço"));
      if (strong) {
        matches.push(products[next]);
        consumed.add(products[next].id);
        pairReasons.forEach((reason) => reasons.add(reason));
      }
    }
    if (matches.length > 1) {
      consumed.add(products[index].id);
      groups.push({ products: matches, reasons: [...reasons] });
    }
  }
  return groups;
}
