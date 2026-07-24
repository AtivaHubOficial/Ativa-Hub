export type DiagnosticTone = "ok" | "warning" | "error";
export type MercadoLivreDiagnosticResult = {
  endpoint: string;
  status: number | null;
  code: string;
  message: string;
  durationMs: number;
  tone: DiagnosticTone;
};

type ApiErrorBody = { error?: unknown; code?: unknown; message?: unknown };
type SearchBody = { results?: unknown };

export function diagnosticMessage(status: number | null, fallback = "") {
  if (status === 403) return "API bloqueou este endpoint.\nVerifique permissões da aplicação no DevCenter.";
  if (status === 401) return "Token expirado.";
  if (status === 429) return "Rate limit.";
  if (status === null) return fallback === "Timeout." ? "Timeout." : "API indisponível.";
  return fallback || (status >= 200 && status < 300 ? "OK" : `HTTP ${status}`);
}

export function diagnosticTone(status: number | null, warning = false): DiagnosticTone {
  if (status !== null && status >= 200 && status < 300) return warning ? "warning" : "ok";
  return "error";
}

function safeBody(value: unknown): ApiErrorBody {
  return value && typeof value === "object" ? value as ApiErrorBody : {};
}

export async function runMercadoLivreDiagnostics(
  accessToken: string,
  request: typeof fetch = fetch,
  timeoutMs = 10_000,
) {
  const origin = "https://api.mercadolibre.com";
  async function call<T>(endpoint: string): Promise<{ result: MercadoLivreDiagnosticResult; body?: T }> {
    const started = performance.now();
    try {
      const response = await request(`${origin}${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "AtivaHub/2.0 (+integration-diagnostics)",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      let body: unknown;
      try { body = await response.json(); } catch { body = undefined; }
      const error = safeBody(body);
      const searchResults = (body as SearchBody | undefined)?.results;
      const warning = response.ok && endpoint.includes("/items/search") &&
        (!Array.isArray(searchResults) || searchResults.length === 0);
      return {
        result: {
          endpoint,
          status: response.status,
          code: String(error.code ?? error.error ?? (response.ok ? "OK" : "HTTP_ERROR")),
          message: warning ? "Nenhum anúncio encontrado para a conta conectada." : diagnosticMessage(response.status, String(error.message ?? "")),
          durationMs: Math.round(performance.now() - started),
          tone: diagnosticTone(response.status, warning),
        },
        body: response.ok ? body as T : undefined,
      };
    } catch (error) {
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      return {
        result: {
          endpoint,
          status: null,
          code: timeout ? "TIMEOUT" : "NETWORK_ERROR",
          message: diagnosticMessage(null, timeout ? "Timeout." : "API indisponível."),
          durationMs: Math.round(performance.now() - started),
          tone: "error",
        },
      };
    }
  }

  const [me, meAttributes] = await Promise.all([
    call<{ id?: unknown; nickname?: unknown }>("/users/me"),
    call<{ id?: unknown; nickname?: unknown }>("/users/me?attributes=id,nickname"),
  ]);
  const search = await call<SearchBody>("/users/me/items/search?limit=1");
  const itemId = Array.isArray(search.body?.results) && typeof search.body.results[0] === "string"
    ? search.body.results[0]
    : null;
  const results = [me.result, meAttributes.result, search.result];
  if (itemId && /^MLB\d+$/.test(itemId)) {
    const [item, reviews] = await Promise.all([
      call(`/items/${encodeURIComponent(itemId)}`),
      call(`/reviews/item/${encodeURIComponent(itemId)}`),
    ]);
    results.push(item.result, reviews.result);
  }
  return {
    checkedAt: new Date().toISOString(),
    account: {
      id: me.body?.id == null ? null : String(me.body.id),
      nickname: me.body?.nickname == null ? null : String(me.body.nickname),
    },
    itemId,
    results,
  };
}
