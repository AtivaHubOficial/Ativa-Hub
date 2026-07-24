import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createAuthorizationRequest, ML_STATE_COOKIE, MercadoLivreOAuthError, secureCookieOptions } from "@/lib/mercado-livre-oauth";
import { resolveMercadoLivreOAuthContext } from "@/lib/mercado-livre-oauth-context";
import { isLocalOAuthRequest, registeredOAuthOrigin } from "@/lib/mercado-livre-oauth-local";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (isLocalOAuthRequest(request.url)) {
    const productionOrigin = registeredOAuthOrigin(process.env.MERCADO_LIVRE_REDIRECT_URI);
    const link = productionOrigin ? `<a href="${productionOrigin}/api/auth/mercado-livre/start">Abrir ambiente HTTPS configurado</a>` : "";
    return new NextResponse(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>OAuth Mercado Livre</title><body style="font-family:system-ui;max-width:640px;margin:64px auto;padding:24px;color:#0f172a"><h1>Autorização disponível no ambiente HTTPS</h1><p>Por segurança, a conexão OAuth do Mercado Livre deve ser realizada utilizando a URL HTTPS configurada para produção.</p><p>O cadastro manual continua disponível neste ambiente local.</p>${link}</body></html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }
  let context;
  try {
    context = resolveMercadoLivreOAuthContext(request.url, process.env.MERCADO_LIVRE_REDIRECT_URI);
  } catch {
    return NextResponse.json({ error: "Não foi possível iniciar a autorização do Mercado Livre." }, { status: 503 });
  }
  if (context.delegateToRegisteredOrigin) return NextResponse.redirect(new URL("/api/auth/mercado-livre/start", context.origin));
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.redirect(new URL(admin.status === 401 ? "/admin/login" : "/admin/acesso-negado", context.origin));
  try {
    const authorization = createAuthorizationRequest(context.redirectUri);
    const response = NextResponse.redirect(authorization.url);
    response.cookies.set(ML_STATE_COOKIE, authorization.stateCookie, secureCookieOptions(10 * 60, context.secureCookie));
    return response;
  } catch (error) {
    console.error("[ml-oauth] start failed", { code: error instanceof MercadoLivreOAuthError ? error.code : "INTERNAL_ERROR", message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Não foi possível iniciar a autorização do Mercado Livre." }, { status: error instanceof MercadoLivreOAuthError ? error.status : 500 });
  }
}
