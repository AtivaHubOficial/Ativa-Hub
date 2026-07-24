import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { getValidMercadoLivreToken, ML_OAUTH_COOKIE, MercadoLivreOAuthError, secureCookieOptions } from "@/lib/mercado-livre-oauth";
import { runMercadoLivreDiagnostics } from "@/lib/mercado-livre-diagnostics";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    const oauth = await getValidMercadoLivreToken();
    const diagnostics = await runMercadoLivreDiagnostics(oauth.accessToken);
    diagnostics.results.forEach((result) => {
      console.info("[ml-diagnostics]", {
        endpoint: result.endpoint,
        status: result.status,
        code: result.code,
        message: result.message,
        durationMs: result.durationMs,
      });
    });
    const response = NextResponse.json(diagnostics);
    if (oauth.refreshedCookie) response.cookies.set(ML_OAUTH_COOKIE, oauth.refreshedCookie, secureCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof MercadoLivreOAuthError) {
      return NextResponse.json({
        error: error.code === "OAUTH_REQUIRED" ? "OAuth necessário." : error.message,
        code: error.code,
        authorizeUrl: "/api/auth/mercado-livre/start",
      }, { status: error.status === 500 ? 502 : error.status });
    }
    return NextResponse.json({ error: "Não foi possível executar o diagnóstico.", code: "DIAGNOSTIC_UNAVAILABLE" }, { status: 502 });
  }
}
