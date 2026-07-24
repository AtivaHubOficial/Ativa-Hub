import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { importMercadoLivreProduct } from "@/lib/mercado-livre-importer";
import { defaultAIProductProvider, hasApplicableAIContent } from "@/lib/ai-product-assistant";
import { isSafePublicHttpsUrl, mapWithConcurrency } from "@/lib/product-discovery";
import { normalizeSlug } from "@/types/product-draft";
import { sanitizeProductDescription } from "@/lib/safe-description";

export type DiscoveryImportItem = { externalOfferId: string };
export type DiscoveryImportResult = { externalOfferId: string; status: "saved" | "ignored" | "failed"; message: string };
export type DiscoveryImportSummary = { selected: number; created: number; duplicates: number; failed: number; reviewRequired: number; results: DiscoveryImportResult[] };

export async function importDiscoveryBatch(items: DiscoveryImportItem[], category: string, accessToken: string): Promise<DiscoveryImportSummary> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase não configurado.");
  const { data: categoryRow } = await client.from("categories").select("id,name").eq("status", "active").eq("name", category).maybeSingle();
  if (!categoryRow) throw new Error("A categoria selecionada não existe.");
  const results = await mapWithConcurrency(items, 3, async ({ externalOfferId }): Promise<DiscoveryImportResult> => {
    if (!/^MLB\d+$/.test(externalOfferId)) return { externalOfferId, status: "failed", message: "Identificador inválido." };
    const { data: duplicate } = await client.from("products").select("id").eq("source", "mercado_livre").or(`external_product_id.eq.${externalOfferId},external_offer_id.eq.${externalOfferId}`).limit(1);
    if (duplicate?.length) return { externalOfferId, status: "ignored", message: "Produto já cadastrado." };
    try {
      const sourceUrl = `https://produto.mercadolivre.com.br/MLB-${externalOfferId.slice(3)}`;
      const imported = await importMercadoLivreProduct(sourceUrl, accessToken);
      const generated = await defaultAIProductProvider.generate({
        title: imported.title, brand: imported.brand, category, categories: [category],
        description: imported.description, price: imported.price, source: imported.source,
        productUrl: imported.sourceUrl, specifications: imported.specifications,
      });
      const useGenerated = hasApplicableAIContent(generated, "all");
      const title = useGenerated ? generated.title : imported.title;
      const description = sanitizeProductDescription(useGenerated ? generated.description : imported.description);
      const images = imported.images.filter((url) => isSafePublicHttpsUrl(url, ["mlstatic.com"]));
      if (!title || imported.price <= 0 || !images.length || !isSafePublicHttpsUrl(imported.sourceUrl, ["mercadolivre.com.br"])) throw new Error("Dados mínimos insuficientes.");
      const payload = {
        source: "mercado_livre", external_product_id: imported.sourceId || externalOfferId, external_offer_id: externalOfferId,
        external_offer_name: imported.title, title, slug: `${normalizeSlug(title).slice(0, 72)}-${externalOfferId.toLowerCase()}`,
        brand: useGenerated ? generated.brand : imported.brand, category, category_id: categoryRow.id, subcategory: null,
        price: imported.price, old_price: imported.oldPrice, rating: imported.rating ?? 0, review_count: imported.reviewCount ?? 0,
        sold_count: 0, full_shipping: false, free_shipping: false, installment_text: "", image_url: images[0], gallery: images,
        description, short_description: sanitizeProductDescription(useGenerated ? generated.shortDescription : imported.shortDescription),
        features: useGenerated ? generated.benefits : [], tags: useGenerated ? generated.keywords : [],
        affiliate_url: imported.sourceUrl, status: "draft", featured: false,
        specifications: useGenerated ? generated.specifications : imported.specifications,
      };
      const { error } = await client.from("products").insert(payload);
      if (error) throw new Error("Não foi possível salvar o rascunho.");
      return { externalOfferId, status: "saved", message: useGenerated ? "Salvo como rascunho." : "Salvo como rascunho para revisão manual." };
    } catch (error) { return { externalOfferId, status: "failed", message: error instanceof Error ? error.message : "Falha na importação." } }
  });
  return {
    selected: items.length, created: results.filter((item) => item.status === "saved").length,
    duplicates: results.filter((item) => item.status === "ignored").length,
    failed: results.filter((item) => item.status === "failed").length,
    reviewRequired: results.filter((item) => item.status === "saved" && /revisão/i.test(item.message)).length, results,
  };
}
