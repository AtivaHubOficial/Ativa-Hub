import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { seedProducts } from "@/lib/data";
import { rowToProduct, type ProductRow } from "@/lib/product-mapper";
import type { Product } from "@/types/product";
import { cache } from "react";

export const getProductPageData = cache(async (id: string): Promise<{ product: Product | null; related: Product[] }> => {
  const client = await createSupabaseServerClient();
  if (!client) {
    const product = seedProducts.find((item) => item.id === id || item.slug === id) ?? null;
    return { product, related: product ? selectRelated(seedProducts, product) : [] };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const { data, error } = await client.from("products").select("*").eq(isUuid ? "id" : "slug", id).eq("status", "active").maybeSingle();
  if (error) throw new Error(error.message);
  const product = data ? rowToProduct(data as ProductRow) : null;
  if (!product) return { product: null, related: [] };

  const { data: rows, error: relatedError } = await client.from("products").select("*").eq("status", "active").neq("id", product.id).limit(12);
  if (relatedError) throw new Error(relatedError.message);
  return { product, related: selectRelated((rows as ProductRow[]).map(rowToProduct), product) };
});

function selectRelated(products: Product[], current: Product): Product[] {
  return [...products]
    .filter((item) => item.id !== current.id && item.status === "active")
    .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 4);
}
