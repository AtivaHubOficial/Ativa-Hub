import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getValidMercadoLivreToken } from "@/lib/mercado-livre-oauth";
import { importMercadoLivreProduct } from "@/lib/mercado-livre-importer";
import { calculateDiscoveryScore, discoverySignals, filterDiscoveryCandidates, mapWithConcurrency, verifiedDiscount, type DiscoveryCandidate, type DiscoverySearchInput, type ProductDiscoveryProvider } from "@/lib/product-discovery";
import { resolveKnownCategory } from "@/lib/category-utils";

const API = "https://api.mercadolibre.com";
export class MercadoLivreDiscoveryProvider implements ProductDiscoveryProvider {
  readonly id = "mercado_livre_account_items";
  async search(input: DiscoverySearchInput) {
    const oauth = await getValidMercadoLivreToken();
    const headers = { Authorization: `Bearer ${oauth.accessToken}`, Accept: "application/json" };
    const request = async <T>(path: string): Promise<T> => {
      const response = await fetch(`${API}${path}`, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(response.status === 403 ? "A API não autorizou a busca de anúncios desta conta." : "Não foi possível consultar os anúncios da conta conectada.");
      return response.json() as Promise<T>;
    };
    const me = await request<{ id?: number }>("/users/me");
    if (!me.id) throw new Error("A conta conectada não retornou um identificador válido.");
    const query = new URLSearchParams({ limit: String(Math.min(20, input.quantity * 2)) });
    if (input.keywords.trim()) query.set("q", input.keywords.trim().slice(0, 100));
    const search = await request<{ results?: string[] }>(`/users/${me.id}/items/search?${query}`);
    const ids = (search.results ?? []).filter((id) => /^MLB\d+$/.test(id)).slice(0, 20);
    const client = await createSupabaseServerClient();
    const { data: rows } = client ? await client.from("products").select("external_product_id,external_offer_id,affiliate_url").eq("source", "mercado_livre") : { data: [] };
    const existing = new Set((rows ?? []).flatMap((row) => [String(row.external_product_id ?? ""), String(row.external_offer_id ?? ""), normalizeUrl(String(row.affiliate_url ?? ""))]).filter(Boolean));
    const categories = client ? (await client.from("categories").select("name").eq("status", "active")).data?.map((row) => String(row.name)) ?? [] : [];
    const candidates = await mapWithConcurrency(ids, 3, async (id): Promise<DiscoveryCandidate | null> => {
      try {
        const imported = await importMercadoLivreProduct(`https://produto.mercadolivre.com.br/MLB-${id.slice(3)}`, oauth.accessToken);
        const specs = imported.specifications ?? [];
        const model = specs.find((item) => /modelo/i.test(item.name))?.value ?? "";
        const suggestedCategory = resolveKnownCategory(imported.category || input.category, categories);
        const offerUrl = imported.sourceUrl;
        const base = {
          source: "mercado_livre" as const, externalProductId: id, externalOfferId: id, title: imported.title,
          originalUrl: offerUrl, offerUrl, imageUrl: imported.images[0] ?? "", price: imported.price, oldPrice: imported.oldPrice,
          discountPercent: verifiedDiscount(imported.price, imported.oldPrice), brand: imported.brand, model, suggestedCategory,
          imageCount: imported.images.length, specificationCount: specs.length, available: imported.availableQuantity !== 0,
          duplicate: existing.has(id) || existing.has(normalizeUrl(offerUrl)),
        };
        const score = calculateDiscoveryScore({ ...base });
        const candidate = { ...base, score, reasons: [], warnings: [] };
        return { ...candidate, ...discoverySignals(candidate) };
      } catch { return null }
    });
    return filterDiscoveryCandidates(candidates.filter((item): item is DiscoveryCandidate => Boolean(item)), input);
  }
}
const normalizeUrl = (raw: string) => { try { const url = new URL(raw); return `${url.origin}${url.pathname.replace(/\/+$/, "")}` } catch { return "" } };

export class TemplateDiscoveryProvider implements ProductDiscoveryProvider {
  readonly id = "template_disabled";
  async search(_input: DiscoverySearchInput): Promise<DiscoveryCandidate[]> { return [] }
}
