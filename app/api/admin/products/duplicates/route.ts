import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { findPossibleDuplicates, type DuplicateProduct } from "@/lib/catalog-maintenance";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const client = await createSupabaseServerClient();
  const { data, error } = await client!.from("products")
    .select("id,title,source,external_product_id,external_offer_id,affiliate_url,image_url,price")
    .order("created_at", { ascending: false }).limit(2000);
  if (error) return NextResponse.json({ error: "Não foi possível analisar duplicidades." }, { status: 500 });
  return NextResponse.json({ groups: findPossibleDuplicates((data ?? []) as DuplicateProduct[]) });
}
