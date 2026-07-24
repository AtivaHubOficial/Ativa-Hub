import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { canDeleteAll, canDeleteSource, validProductIds } from "@/lib/catalog-maintenance";

type Body = Record<string, unknown>;
async function bodyOf(request: Request): Promise<Body | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? body as Body : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const body = await bodyOf(request);
  const ids = validProductIds(body?.ids);
  if (!body || !ids.length) return NextResponse.json({ error: "Selecione produtos válidos." }, { status: 400 });
  const client = await createSupabaseServerClient();
  let values: Record<string, unknown>;
  if (body.action === "activate") values = { status: "active" };
  else if (body.action === "deactivate") values = { status: "paused" };
  else if (body.action === "category" && typeof body.categoryId === "string") {
    const { data: category } = await client!.from("categories").select("id,name").eq("id", body.categoryId).eq("status", "active").maybeSingle();
    if (!category) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
    values = { category_id: category.id, category: category.name };
  } else return NextResponse.json({ error: "Ação em lote inválida." }, { status: 400 });
  const { data, error } = await client!.from("products").update(values).in("id", ids).select("id");
  if (error) return NextResponse.json({ error: "Não foi possível atualizar os produtos." }, { status: 500 });
  return NextResponse.json({ updated: data?.length ?? 0 });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const body = await bodyOf(request);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const client = await createSupabaseServerClient();
  let query = client!.from("products").delete();
  if (body.mode === "ids") {
    const ids = validProductIds(body.ids);
    if (!ids.length || body.confirmation !== "EXCLUIR SELECIONADOS") return NextResponse.json({ error: "Confirmação inválida." }, { status: 400 });
    query = query.in("id", ids);
  } else if (body.mode === "source" && canDeleteSource(body.source, body.confirmation)) {
    query = query.eq("source", body.source);
  } else if (body.mode === "all" && canDeleteAll(body.confirmation)) {
    query = query.neq("id", "00000000-0000-0000-0000-000000000000");
  } else return NextResponse.json({ error: "Exclusão não autorizada." }, { status: 400 });
  const { data, error } = await query.select("id");
  if (error) return NextResponse.json({ error: "Não foi possível excluir os produtos." }, { status: 500 });
  return NextResponse.json({ deleted: data?.length ?? 0 });
}
