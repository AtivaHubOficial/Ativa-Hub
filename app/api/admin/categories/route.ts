import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { categoryConflict, readAdminCategories } from "@/lib/category-server";
import { categoryKey, validateCategoryInput } from "@/lib/category-utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const client = await createSupabaseServerClient();
  try {
    return NextResponse.json({ categories: await readAdminCategories(client!) });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as categorias." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
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
    if (await categoryConflict(client!, parsed.value.name, parsed.value.slug)) {
      return NextResponse.json({ error: "Já existe uma categoria equivalente ou com este slug." }, { status: 409 });
    }
    const { data, error } = await client!.from("categories").insert({
      name: parsed.value.name,
      slug: parsed.value.slug,
      normalized_key: categoryKey(parsed.value.name),
      description: parsed.value.description || null,
      status: parsed.value.status,
      display_order: parsed.value.displayOrder,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar a categoria." }, { status: 500 });
  }
}
