import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPartnerOverview,
  integrationStatus,
  normalizeProductSource,
  sanitizeDiagnostic,
  sourceMetrics,
} from "./partner-diagnostics.ts";

test("identifica origens conhecidas sem misturar produtos manuais", () => {
  assert.equal(normalizeProductSource("logzz"), "logzz");
  assert.equal(normalizeProductSource("Mercado Livre"), "mercado_livre");
  assert.equal(normalizeProductSource("outro"), "manual");
});

test("calcula produtos importados e ativos por origem", () => {
  const metrics = sourceMetrics([
    { source: "logzz", status: "active", created_at: "2026-01-01T00:00:00Z" },
    { source: "logzz", status: "paused", updated_at: "2026-01-02T00:00:00Z" },
    { source: "manual", status: "active" },
  ], "logzz");
  assert.equal(metrics.importedProducts, 2);
  assert.equal(metrics.activeProducts, 1);
  assert.equal(metrics.lastImport, "2026-01-02T00:00:00Z");
});

test("representa ausência segura de configuração e OAuth", () => {
  assert.equal(integrationStatus(false, false, false), "Não configurado");
  assert.equal(integrationStatus(true, false, false), "Atenção necessária");
  const partners = buildPartnerOverview({
    products: [],
    logzzConfigured: false,
    mercadoLivreConfigured: true,
    mercadoLivreOAuthPresent: false,
  });
  assert.equal(partners.find((item) => item.key === "logzz")?.status, "Não configurado");
  assert.equal(partners.find((item) => item.key === "mercado_livre")?.status, "Atenção necessária");
  assert.equal(partners.find((item) => item.key === "amazon")?.status, "Em desenvolvimento");
});

test("sanitiza erros sem expor credenciais", () => {
  const diagnostic = sanitizeDiagnostic(
    "Authorization: Bearer segredo access_token=abc refresh_token=def client_secret=ghi cookie=session",
  );
  assert.doesNotMatch(diagnostic, /segredo|abc|def|ghi|session/);
  assert.match(diagnostic, /\[protegido\]/);
});

test("diagnósticos não incluem valores de configuração", () => {
  const serialized = JSON.stringify(buildPartnerOverview({
    products: [],
    logzzConfigured: true,
    mercadoLivreConfigured: true,
    mercadoLivreOAuthPresent: true,
  }));
  assert.doesNotMatch(serialized, /access_token|refresh_token|client_secret|Bearer /i);
});
