import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildPartnerOverview, sanitizeDiagnostic } from "@/lib/partner-diagnostics";
import { inspectMercadoLivreOAuthSession, ML_OAUTH_COOKIE } from "@/lib/mercado-livre-oauth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const client = await createSupabaseServerClient();
  try {
    const { data, error } = await client!.from("products").select("source,status,created_at,updated_at");
    if (error) throw error;
    const store = await cookies();
    const mercadoLivreSession = inspectMercadoLivreOAuthSession(store.get(ML_OAUTH_COOKIE)?.value);
    const partners = buildPartnerOverview({
      products: data ?? [],
      logzzConfigured: Boolean(process.env.LOGZZ_API_TOKEN?.trim()),
      mercadoLivreConfigured: Boolean(
        process.env.MERCADO_LIVRE_CLIENT_ID?.trim() &&
        process.env.MERCADO_LIVRE_CLIENT_SECRET?.trim() &&
        process.env.MERCADO_LIVRE_REDIRECT_URI?.trim(),
      ),
      mercadoLivreOAuthPresent: mercadoLivreSession.connected,
      mercadoLivreAccountId: mercadoLivreSession.userId,
      mercadoLivreExpiresAt: mercadoLivreSession.expiresAt ? new Date(mercadoLivreSession.expiresAt).toISOString() : null,
    });
    return NextResponse.json({ partners });
  } catch (error) {
    return NextResponse.json({
      error: sanitizeDiagnostic(error) || "Não foi possível carregar os parceiros.",
    }, { status: 500 });
  }
}
