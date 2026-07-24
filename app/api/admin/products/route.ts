import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { rowToProduct, type ProductRow } from "@/lib/product-mapper";
import { ALLOWED_PRODUCT_SOURCES } from "@/lib/catalog-maintenance";

const statuses = ["active", "draft", "paused"] as const;

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(60, Math.max(4, Number(params.get("pageSize")) || 24));
  const search = (params.get("search") ?? "").trim().slice(0, 100).replace(/[%_,]/g, "");
  const category = (params.get("category") ?? "").trim().slice(0, 100);
  const status = params.get("status");
  const source = params.get("source");
  const featured = params.get("featured");
  const client = await createSupabaseServerClient();
  let query = client!.from("products").select("*", { count: "exact" });
  if (search) query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%`);
  if (category && category !== "all") query = query.eq("category", category);
  if (statuses.includes(status as typeof statuses[number])) query = query.eq("status", status);
  if (ALLOWED_PRODUCT_SOURCES.includes(source as typeof ALLOWED_PRODUCT_SOURCES[number])) query = query.eq("source", source);
  if (featured === "featured" || featured === "not-featured") query = query.eq("featured", featured === "featured");
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  return NextResponse.json({ products: (data as ProductRow[]).map(rowToProduct), total: count ?? 0, page, pageSize });
}
