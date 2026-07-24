export type DiscoveryCandidate = {
  source: "mercado_livre";
  externalProductId: string;
  externalOfferId: string;
  title: string;
  originalUrl: string;
  offerUrl: string;
  imageUrl: string;
  price: number;
  oldPrice: number | null;
  discountPercent: number;
  brand: string;
  model: string;
  suggestedCategory: string;
  imageCount: number;
  specificationCount: number;
  available: boolean;
  duplicate: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
};
export type DiscoverySearchInput = { category: string; keywords: string; quantity: 5 | 10 | 20; minPrice?: number; maxPrice?: number; minDiscount?: number };
export interface ProductDiscoveryProvider { readonly id: string; search(input: DiscoverySearchInput): Promise<DiscoveryCandidate[]> }

export function isSafePublicHttpsUrl(raw: string, allowedHosts: string[]) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return false;
    return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch { return false }
}
export function verifiedDiscount(price: number, oldPrice: number | null) {
  return price > 0 && oldPrice !== null && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
}
export function calculateDiscoveryScore(candidate: Omit<DiscoveryCandidate, "score" | "reasons" | "warnings">) {
  let score = 0;
  if (candidate.available && isSafePublicHttpsUrl(candidate.offerUrl, ["mercadolivre.com.br"])) score += 20;
  if (isSafePublicHttpsUrl(candidate.imageUrl, ["mlstatic.com"])) score += 10;
  score += Math.min(candidate.imageCount, 6) * 2;
  if (candidate.price > 0) score += 12;
  if (candidate.oldPrice !== null && candidate.oldPrice > candidate.price) score += 8;
  if (verifiedDiscount(candidate.price, candidate.oldPrice) > 0) score += 5;
  if (candidate.brand) score += 7;
  if (candidate.model) score += 6;
  score += Math.min(candidate.specificationCount, 10);
  if (candidate.title.trim().length >= 20) score += 5;
  if (candidate.suggestedCategory) score += 5;
  if (!candidate.duplicate) score += 5;
  return Math.min(score, 100);
}
export function discoverySignals(candidate: DiscoveryCandidate) {
  const reasons: string[] = [], warnings: string[] = [];
  if (candidate.available && isSafePublicHttpsUrl(candidate.offerUrl, ["mercadolivre.com.br"])) reasons.push("Oferta válida");
  if (candidate.imageCount) reasons.push(`Possui ${candidate.imageCount} ${candidate.imageCount === 1 ? "imagem" : "imagens"}`);
  if (candidate.specificationCount) reasons.push(`Ficha técnica com ${candidate.specificationCount} especificações`);
  if (candidate.brand && candidate.model) reasons.push("Marca e modelo identificados");
  if (candidate.discountPercent > 0) reasons.push("Desconto informado pela fonte");
  if (!candidate.duplicate) reasons.push("Ainda não cadastrado");
  if (!candidate.oldPrice || candidate.oldPrice <= candidate.price) warnings.push("Sem preço anterior verificável");
  if (candidate.specificationCount < 3) warnings.push("Poucas especificações");
  if (!candidate.suggestedCategory) warnings.push("Categoria não identificada");
  if (!candidate.available) warnings.push("Oferta indisponível");
  if (candidate.duplicate) warnings.push("Produto já cadastrado");
  return { reasons, warnings };
}
export function filterDiscoveryCandidates(items: DiscoveryCandidate[], input: DiscoverySearchInput) {
  return items.filter((item) =>
    (!input.minPrice || item.price >= input.minPrice) &&
    (!input.maxPrice || item.price <= input.maxPrice) &&
    (!input.minDiscount || item.discountPercent >= input.minDiscount)
  ).slice(0, Math.min(input.quantity, 20));
}
export async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length); let cursor = 0;
  async function run() { while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index], index) } }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
  return results;
}
export function candidateSelectable(candidate: DiscoveryCandidate) {
  return !candidate.duplicate && candidate.available && candidate.price > 0 &&
    isSafePublicHttpsUrl(candidate.offerUrl, ["mercadolivre.com.br"]) &&
    isSafePublicHttpsUrl(candidate.imageUrl, ["mlstatic.com"]) && Boolean(candidate.title);
}
