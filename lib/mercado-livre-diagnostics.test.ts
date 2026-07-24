import test from "node:test";
import assert from "node:assert/strict";
import { diagnosticMessage, diagnosticTone, runMercadoLivreDiagnostics } from "./mercado-livre-diagnostics.ts";

test("traduz status oficiais nas mensagens exigidas", () => {
  assert.equal(diagnosticMessage(403), "API bloqueou este endpoint.\nVerifique permissões da aplicação no DevCenter.");
  assert.equal(diagnosticMessage(401), "Token expirado.");
  assert.equal(diagnosticMessage(429), "Rate limit.");
  assert.equal(diagnosticMessage(null, "Timeout."), "Timeout.");
  assert.equal(diagnosticTone(200), "ok");
  assert.equal(diagnosticTone(200, true), "warning");
  assert.equal(diagnosticTone(403), "error");
});

test("executa detalhes somente quando a busca retorna item e não expõe token", async () => {
  const urls: string[] = [];
  const request = async (input: string | URL | Request) => {
    const url = String(input); urls.push(url);
    const body = url.includes("items/search") ? { results: ["MLB1234567890"] } :
      url.endsWith("/users/me") ? { id: 123, nickname: "conta" } : {};
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const result = await runMercadoLivreDiagnostics("segredo-oauth", request as typeof fetch, 1000);
  assert.equal(result.results.length, 5);
  assert.equal(result.itemId, "MLB1234567890");
  assert.equal(JSON.stringify(result).includes("segredo-oauth"), false);
  assert.equal(urls.some((url) => url.endsWith("/items/MLB1234567890")), true);
});

test("busca vazia vira warning e não consulta item", async () => {
  const request = async () => new Response(JSON.stringify({ results: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  const result = await runMercadoLivreDiagnostics("token", request as typeof fetch, 1000);
  assert.equal(result.results.length, 3);
  assert.equal(result.results[2].tone, "warning");
});
