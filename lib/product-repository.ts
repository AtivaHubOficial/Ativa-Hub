import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { seedProducts } from "@/lib/data";
import type { Product } from "@/types/product";
import { rowToProduct, type ProductRow } from "@/lib/product-mapper";
import { categoriesEquivalent } from "@/lib/category-utils";

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function listProducts(admin = false): Promise<Product[]> {
  const client = createSupabaseBrowserClient();
  if (!client) return seedProducts;
  let query = client.from("products").select("*").order("created_at", { ascending: false });
  if (!admin) query = query.eq("status", "active");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const client = createSupabaseBrowserClient();
  if (!client) return seedProducts.find((product) => product.id === id) ?? null;
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProduct(data as ProductRow) : null;
}

export async function listCategories(): Promise<string[]> {
  const client = createSupabaseBrowserClient();
  if (!client) {
    return Array.from(new Set(seedProducts.filter((product) => product.status === "active").map((product) => product.category)));
  }
  const [{ data: categories, error }, { data: products, error: productsError }] =
    await Promise.all([
      client.from("categories").select("name").eq("status", "active").order("display_order").order("name"),
      client.from("products").select("category").eq("status", "active"),
    ]);
  if (error || productsError) throw new Error(error?.message ?? productsError?.message);
  const used = (products ?? []).map((row) => row.category);
  return (categories ?? []).map((row) => row.name).filter((name) =>
    used.some((category) => categoriesEquivalent(category, name)),
  );
}

export async function listProductFormCategories(): Promise<string[]> {
  const client = createSupabaseBrowserClient();
  if (!client) return Array.from(new Set(seedProducts.map((product) => product.category)));
  const { data, error } = await client.from("categories").select("name").eq("status", "active").order("display_order").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.name);
}

export async function findCategoryId(name: string): Promise<string | null> {
  const client = createSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.from("categories").select("id,name");
  if (error) throw new Error(error.message);
  return (data ?? []).find((row) => categoriesEquivalent(row.name, name))?.id ?? null;
}
