import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { categoryConflict, readAdminCategories } from "@/lib/category-server";
import { canDeleteCategory, categoryKey, validateCategoryInput } from "@/lib/category-utils";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { id } = await context.params;
  const client = await createSupabaseServerClient();
  try {
    const category = (await readAdminCategories(client!)).find((item) => item.id === id);
    return category
      ? NextResponse.json({ category })
      : NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a categoria." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const parsed = validateCategoryInput(
    body && typeof body === "object" ? body as Record<string, unknown> : { name: "", slug: "" },
  );
  if (!parsed.valid) return NextResponse.json({ error: parsed.errors[0] }, { status: 400 });
  const client = await createSupabaseServerClient();
  try {
    if (await categoryConflict(client!, parsed.value.name, parsed.value.slug, id)) {
      return NextResponse.json({ error: "Já existe uma categoria equivalente ou com este slug." }, { status: 409 });
    }
    const { data: previous } = await client!.from("categories").select("name").eq("id", id).maybeSingle();
    if (!previous) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    const { error } = await client!.from("categories").update({
      name: parsed.value.name,
      slug: parsed.value.slug,
      normalized_key: categoryKey(parsed.value.name),
      description: parsed.value.description || null,
      status: parsed.value.status,
      display_order: parsed.value.displayOrder,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
    await client!.from("products").update({ category: parsed.value.name }).eq("category_id", id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a categoria." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { id } = await context.params;
  const client = await createSupabaseServerClient();
  try {
    const category = (await readAdminCategories(client!)).find((item) => item.id === id);
    if (!category) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    if (!canDeleteCategory(category.productCount)) {
      return NextResponse.json({
        error: `Esta categoria possui ${category.productCount} produto(s) vinculado(s) e não pode ser excluída.`,
        productCount: category.productCount,
      }, { status: 409 });
    }
    const { error } = await client!.from("categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ deleted: 1 });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir a categoria." }, { status: 500 });
  }
}
