import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { seedProducts } from "@/lib/data";
import type { Category } from "@/types/category";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: Category["status"];
  display_order: number | null;
  created_at: string;
  updated_at: string;
};

export function categoryRowToModel(
  row: CategoryRow,
  productCount = 0,
): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    status: row.status,
    displayOrder: row.display_order ?? 0,
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminCategories(): Promise<Category[]> {
  const client = createSupabaseBrowserClient();
  if (!client) {
    return Array.from(new Set(seedProducts.map((product) => product.category)))
      .map((name, index) => ({
        id: `local-${index}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: "",
        status: "active" as const,
        displayOrder: index,
        productCount: seedProducts.filter((product) => product.category === name).length,
        createdAt: "",
        updatedAt: "",
      }));
  }
  const response = await fetch("/api/admin/categories", { cache: "no-store" });
  const body = await response.json() as { categories?: Category[]; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Erro ao carregar categorias.");
  return body.categories ?? [];
}

export async function getAdminCategory(id: string): Promise<Category | null> {
  const response = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  const body = await response.json() as { category?: Category; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Erro ao carregar categoria.");
  return body.category ?? null;
}
