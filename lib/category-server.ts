import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryKey, categoriesEquivalent } from "@/lib/category-utils";
import { categoryRowToModel } from "@/lib/category-repository";
import type { Category } from "@/types/category";

type CategoryRow = Parameters<typeof categoryRowToModel>[0];
type ProductCategoryRow = { category: string; category_id: string | null };

export async function readAdminCategories(
  client: SupabaseClient,
): Promise<Category[]> {
  const [{ data: categories, error }, { data: products, error: productError }] =
    await Promise.all([
      client.from("categories").select("id,name,slug,description,status,display_order,created_at,updated_at").order("display_order").order("name"),
      client.from("products").select("category,category_id"),
    ]);
  if (error || productError) throw new Error("Não foi possível carregar as categorias.");
  const rows = (products ?? []) as ProductCategoryRow[];
  return ((categories ?? []) as CategoryRow[]).map((row) => {
    const count = rows.filter((product) =>
      product.category_id
        ? product.category_id === row.id
        : categoriesEquivalent(product.category, row.name),
    ).length;
    return categoryRowToModel(row, count);
  });
}

export async function categoryConflict(
  client: SupabaseClient,
  name: string,
  slug: string,
  exceptId?: string,
) {
  const { data, error } = await client
    .from("categories")
    .select("id,name,slug,normalized_key");
  if (error) throw new Error("Não foi possível validar a categoria.");
  const key = categoryKey(name);
  return (data ?? []).some((row) =>
    row.id !== exceptId && (row.slug === slug || row.normalized_key === key),
  );
}
