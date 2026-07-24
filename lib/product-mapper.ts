import type { Product } from "@/types/product";
import { sanitizeProductDescription } from "@/lib/safe-description";

export type ProductRow = {
  id: string; slug: string | null; title: string; brand: string | null; category: string; subcategory: string | null;
  price: number | string; old_price: number | string | null; rating: number | string | null; review_count: number | null;
  sold_count: number | null; full_shipping: boolean | null; free_shipping: boolean | null; installment_text: string | null;
  image_url: string | null; gallery: string[] | null; description: string | null; short_description: string | null;
  features: string[] | null; tags: string[] | null; affiliate_url: string; status: Product["status"]; featured: boolean | null;
  specifications: Array<{ name: string; value: string }> | null; source?: Product["source"] | null;
  external_offer_name?: string | null; created_at: string;
};

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id, slug: row.slug ?? row.id, title: row.title, brand: row.brand ?? "", category: row.category,
    subcategory: row.subcategory ?? "", price: Number(row.price), oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    rating: Number(row.rating ?? 0), reviewCount: row.review_count ?? 0, soldCount: row.sold_count ?? 0,
    fullShipping: Boolean(row.full_shipping), freeShipping: Boolean(row.free_shipping), installmentText: row.installment_text ?? "",
    imageUrl: row.image_url ?? "", gallery: row.gallery ?? [], description: sanitizeProductDescription(row.description),
    shortDescription: sanitizeProductDescription(row.short_description), features: row.features ?? [], tags: row.tags ?? [], affiliateUrl: row.affiliate_url,
    status: row.status, featured: Boolean(row.featured), specifications: row.specifications ?? [],
    source: row.source ?? "manual", externalOfferName: row.external_offer_name ?? "", createdAt: row.created_at,
  };
}
