import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { readAdminCategories } from "@/lib/category-server";
import { rowToProduct, type ProductRow } from "@/lib/product-mapper";

export async function readAdminDashboard() {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase não configurado.");
  const [total, active, featured, recent, categories] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }),
    client.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    client.from("products").select("id", { count: "exact", head: true }).eq("featured", true),
    client.from("products").select("*").order("created_at", { ascending: false }).limit(5),
    readAdminCategories(client),
  ]);
  if (total.error || active.error || featured.error || recent.error) {
    throw new Error("Não foi possível carregar os indicadores do catálogo.");
  }
  return {
    totalProducts: total.count ?? 0,
    activeProducts: active.count ?? 0,
    featuredProducts: featured.count ?? 0,
    totalCategories: categories.length,
    recentProducts: (recent.data as ProductRow[]).map(rowToProduct),
  };
}
