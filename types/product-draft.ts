export type ProductPartner = "Amazon" | "Mercado Livre" | "Magalu" | "Shopee" | "AliExpress" | "Outro";
export type DraftSpecification = { id: string; name: string; value: string };
export type DraftHighlight = { id: string; text: string };
export type ProductDraft = {
  name: string; slug: string; brand: string; category: string; shortDescription: string; fullDescription: string;
  currentPrice: string; previousPrice: string; partner: ProductPartner | ""; partnerUrl: string; affiliateCode: string; buyButtonText: string;
  mainImageUrl: string; galleryUrls: string[]; specifications: DraftSpecification[]; highlights: DraftHighlight[];
  active: boolean; featured: boolean; rating: string; reviewCount: string;
};
export type ProductDraftErrors = Partial<Record<keyof ProductDraft, string>>;
export const normalizeSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
export const isHttpUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } };
export function validateProductDraft(draft: ProductDraft): ProductDraftErrors {
  const errors: ProductDraftErrors = {}; const current = Number(draft.currentPrice.replace(",", ".")); const previous = draft.previousPrice ? Number(draft.previousPrice.replace(",", ".")) : undefined;
  if (!draft.name.trim()) errors.name = "Informe o nome do produto."; if (!draft.slug.trim()) errors.slug = "Informe um slug válido."; if (!draft.category.trim()) errors.category = "Informe a categoria.";
  if (!draft.currentPrice || !Number.isFinite(current) || current <= 0) errors.currentPrice = "Informe um preço atual maior que zero.";
  if (previous !== undefined && (!Number.isFinite(previous) || previous < 0 || (Number.isFinite(current) && previous < current))) errors.previousPrice = "O preço anterior deve ser maior ou igual ao preço atual.";
  if (!draft.partner) errors.partner = "Selecione o parceiro."; if (!draft.partnerUrl.trim() || !isHttpUrl(draft.partnerUrl)) errors.partnerUrl = "Informe uma URL iniciada por http:// ou https://.";
  if (!draft.mainImageUrl.trim() || !isHttpUrl(draft.mainImageUrl)) errors.mainImageUrl = "Informe uma URL de imagem válida."; if (draft.galleryUrls.some((url) => url.trim() && !isHttpUrl(url))) errors.galleryUrls = "Corrija ou remova as URLs de galeria inválidas.";
  const rating = draft.rating ? Number(draft.rating.replace(",", ".")) : undefined; if (rating !== undefined && (!Number.isFinite(rating) || rating < 0 || rating > 5)) errors.rating = "A avaliação deve ficar entre 0 e 5.";
  const count = draft.reviewCount ? Number(draft.reviewCount) : undefined; if (count !== undefined && (!Number.isInteger(count) || count < 0)) errors.reviewCount = "A quantidade deve ser um número inteiro não negativo."; return errors;
}
