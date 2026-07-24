import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { importDiscoveryBatch, type DiscoveryImportItem } from "@/lib/discovery-import";
import { getValidMercadoLivreToken, ML_OAUTH_COOKIE, secureCookieOptions } from "@/lib/mercado-livre-oauth";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  let body: { candidates?: DiscoveryImportItem[]; category?: string; confirmDraft?: boolean };
  try { body = await request.json() as typeof body } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }) }
  if (!body.confirmDraft || !Array.isArray(body.candidates) || !body.candidates.length || body.candidates.length > 20 || typeof body.category !== "string") {
    return NextResponse.json({ error: "Confirme a criação de 1 a 20 rascunhos." }, { status: 400 });
  }
  try {
    const oauth = await getValidMercadoLivreToken();
    const summary = await importDiscoveryBatch(body.candidates.map((item) => ({ externalOfferId: String(item.externalOfferId ?? "").slice(0, 32) })), body.category, oauth.accessToken);
    const response = NextResponse.json({ summary });
    if (oauth.refreshedCookie) response.cookies.set(ML_OAUTH_COOKIE, oauth.refreshedCookie, secureCookieOptions());
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Importação em lote indisponível." }, { status: 502 }) }
}
