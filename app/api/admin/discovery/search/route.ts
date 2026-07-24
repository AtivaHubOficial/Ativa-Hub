import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MercadoLivreDiscoveryProvider } from "@/lib/mercado-livre-discovery";
import type { DiscoverySearchInput } from "@/lib/product-discovery";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  let body: Partial<DiscoverySearchInput>;
  try { body = await request.json() as Partial<DiscoverySearchInput> } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }) }
  const quantity = Number(body.quantity);
  if (![5, 10, 20].includes(quantity) || typeof body.category !== "string") return NextResponse.json({ error: "Critérios inválidos." }, { status: 400 });
  const client = await createSupabaseServerClient();
  const { data } = client ? await client.from("categories").select("name").eq("status", "active") : { data: [] };
  if (!(data ?? []).some((row) => row.name === body.category)) return NextResponse.json({ error: "Selecione uma categoria existente." }, { status: 400 });
  try {
    const candidates = await new MercadoLivreDiscoveryProvider().search({
      category: body.category, keywords: String(body.keywords ?? "").slice(0, 100), quantity: quantity as 5 | 10 | 20,
      minPrice: positive(body.minPrice), maxPrice: positive(body.maxPrice), minDiscount: positive(body.minDiscount),
    });
    return NextResponse.json({ candidates, limitation: "A descoberta exibe somente anúncios da conta Mercado Livre conectada; a API autorizada não oferece busca global neste projeto." });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Busca indisponível." }, { status: 502 }) }
}
const positive = (value: unknown) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : undefined };
