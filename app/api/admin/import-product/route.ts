import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { importMercadoLivreProduct, MercadoLivreImportError, type ImportErrorCode } from "@/lib/mercado-livre-importer";
import { getValidMercadoLivreToken, ML_OAUTH_COOKIE, MercadoLivreOAuthError, secureCookieOptions } from "@/lib/mercado-livre-oauth";

export const runtime = "nodejs";
const statusByCode: Record<ImportErrorCode, number> = {
  INVALID_URL: 400, ITEM_ID_NOT_FOUND: 400, USER_PRODUCT_UNSUPPORTED: 422,
  CATALOG_DATA_INCOMPLETE: 422, OFFER_ITEM_NOT_FOUND: 404, API_NOT_FOUND: 404,
  API_UNAUTHORIZED: 401, API_FORBIDDEN: 403, RATE_LIMIT: 429, API_UNAVAILABLE: 503,
  TIMEOUT: 504, NETWORK_ERROR: 502, UNEXPECTED_RESPONSE: 502, NORMALIZATION_ERROR: 422,
};
const messageByCode: Record<ImportErrorCode, string> = {
  INVALID_URL: "Informe uma URL válida do Mercado Livre.",
  ITEM_ID_NOT_FOUND: "Não foi possível identificar o produto nessa URL.",
  USER_PRODUCT_UNSUPPORTED: "Este produto oficial não informou uma oferta compatível.",
  CATALOG_DATA_INCOMPLETE: "O catálogo não forneceu dados suficientes para preencher o produto.",
  OFFER_ITEM_NOT_FOUND: "A oferta informada não foi encontrada para este produto.",
  API_NOT_FOUND: "Produto não encontrado ou indisponível no Mercado Livre.",
  API_UNAUTHORIZED: "Sua conexão com o Mercado Livre expirou. Conecte novamente.",
  API_FORBIDDEN: "O Mercado Livre não autorizou o acesso a este produto com a conta conectada.",
  RATE_LIMIT: "Muitas consultas foram realizadas. Aguarde alguns instantes e tente novamente.",
  API_UNAVAILABLE: "A API do Mercado Livre está temporariamente indisponível.",
  TIMEOUT: "O Mercado Livre demorou para responder. Tente novamente.",
  NETWORK_ERROR: "Não foi possível conectar à API do Mercado Livre.",
  UNEXPECTED_RESPONSE: "O Mercado Livre retornou uma resposta inesperada.",
  NORMALIZATION_ERROR: "Os dados recebidos não puderam ser preparados para o cadastro.",
};
function rotateToken(response: NextResponse, refreshedCookie?: string) {
  if (refreshedCookie) response.cookies.set(ML_OAUTH_COOKIE, refreshedCookie, secureCookieOptions());
  return response;
}
function logFailure(requestId: string, error: unknown, url: string) {
  const safeInput = (() => { try { const parsed = new URL(url); return `${parsed.origin}${parsed.pathname}`; } catch { return "invalid-url"; } })();
  console.error("[product-import] failed", { requestId, input: safeInput, code: error instanceof MercadoLivreImportError || error instanceof MercadoLivreOAuthError ? error.code : "INTERNAL_ERROR" });
}
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error, code: admin.status === 401 ? "SESSION_EXPIRED" : "FORBIDDEN", requestId }, { status: admin.status });
  let url = "";
  try { const body = await request.json() as { url?: unknown }; url = typeof body.url === "string" ? body.url.trim() : ""; }
  catch { return NextResponse.json({ error: "Requisição inválida.", code: "INVALID_REQUEST", requestId }, { status: 400 }); }
  if (!url || url.length > 2048) return NextResponse.json({ error: "URL inválida. Informe o endereço completo do anúncio.", code: "INVALID_URL", requestId }, { status: 400 });
  let refreshedCookie: string | undefined;
  try {
    const oauth = await getValidMercadoLivreToken();
    refreshedCookie = oauth.refreshedCookie;
    const product = await importMercadoLivreProduct(url, oauth.accessToken);
    return rotateToken(NextResponse.json({ product, requestId }), refreshedCookie);
  } catch (error) {
    logFailure(requestId, error, url);
    if (error instanceof MercadoLivreOAuthError) return NextResponse.json({ error: error.message, code: error.code, requestId, authorizeUrl: "/api/auth/mercado-livre/start" }, { status: error.status === 500 ? 502 : error.status });
    if (error instanceof MercadoLivreImportError) return rotateToken(NextResponse.json({ error: messageByCode[error.code], code: error.code, requestId, ...(error.code === "API_UNAUTHORIZED" ? { authorizeUrl: "/api/auth/mercado-livre/start" } : {}) }, { status: statusByCode[error.code] }), refreshedCookie);
    return rotateToken(NextResponse.json({ error: "A importação está temporariamente indisponível. Tente novamente.", code: "INTERNAL_ERROR", requestId }, { status: 502 }), refreshedCookie);
  }
}
