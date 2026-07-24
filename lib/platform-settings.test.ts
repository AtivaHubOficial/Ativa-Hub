import assert from "node:assert/strict";
import test from "node:test";
import {
  clampProductsPerPage,
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  normalizeWhatsapp,
  safePublicUrl,
  sanitizePlainText,
} from "./platform-settings.ts";

test("aceita somente URLs públicas HTTPS", () => {
  assert.equal(safePublicUrl("https://example.com/logo.png"), "https://example.com/logo.png");
  assert.equal(safePublicUrl("http://example.com/logo.png"), "");
  assert.equal(safePublicUrl("javascript:alert(1)"), "");
});

test("normaliza WhatsApp brasileiro", () => {
  assert.equal(normalizeWhatsapp("(11) 99999-8888"), "+5511999998888");
  assert.equal(normalizeWhatsapp("+55 11 99999-8888"), "+5511999998888");
});

test("limita paginação em intervalo seguro", () => {
  assert.equal(clampProductsPerPage(2), 4);
  assert.equal(clampProductsPerPage(200), 60);
  assert.equal(clampProductsPerPage(24), 24);
});

test("usa fallback completo quando não há configuração", () => {
  assert.deepEqual(normalizePlatformSettings(null), DEFAULT_PLATFORM_SETTINGS);
});

test("remove scripts, tags e entidades básicas dos textos", () => {
  assert.equal(sanitizePlainText("<script>alert(1)</script><b>Casa&nbsp;&amp;&nbsp;Jardim</b>"), "Casa & Jardim");
});

test("carrega somente campos públicos normalizados", () => {
  const settings = normalizePlatformSettings({
    platformName: " Minha Loja ",
    productsPerPage: 12,
    showEmptyRatings: true,
    instagramUrl: "https://instagram.com/minhaloja",
  });
  assert.equal(settings.platformName, "Minha Loja");
  assert.equal(settings.productsPerPage, 12);
  assert.equal(settings.showEmptyRatings, true);
  assert.equal("token" in settings, false);
});
