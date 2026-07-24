import assert from "node:assert/strict";
import test from "node:test";
import { requestLogzzProducts } from "./connectors/logzz/transport.ts";
import { LogzzError } from "./connectors/logzz/errors.ts";
import {
  mapLogzzCandidates,
  parseLogzzResponse,
  stripHtml,
} from "./connectors/logzz/mapper.ts";
import {
  resolveCategoryName,
  safeLogzzImageUrl,
} from "./connectors/logzz/validation.ts";
import { planLogzzSync } from "./connectors/logzz/sync.ts";
import {
  requiresLogzzImportConfirmation,
  toggleVisibleSelection,
} from "../components/admin/products/logzz-selection.ts";
import { matchesSourceFilter } from "../components/admin/products/product-filters.ts";
import type { LogzzImportCandidate } from "./connectors/logzz/types.ts";
import type { Product } from "../types/product.ts";

const imageUrl =
  "https://logzz-s3.s3.us-east-2.amazonaws.com/products/image.jpg?version=1";
const response = {
  message: "ok",
  data: {
    producer: [{
      name: "Produtor",
      hash: "p1",
      description: "<p>Primeira linha</p><script>perigo()</script><p>Segunda linha</p>",
      categories: [],
      main_image_url: imageUrl,
      specifications: [{ name: "Cor", value: "Azul" }],
      variations: [],
      offers: [
        {
          hash: "o1",
          name: "Oferta inteira",
          price: 97,
          scheduling_checkout_url: "https://checkout.test/s",
          expedition_checkout_url: "https://checkout.test/e",
        },
        {
          hash: "o2",
          name: "Oferta decimal",
          price: "29,9",
          scheduling_checkout_url: "https://checkout.test/d",
        },
      ],
    }],
    affiliate: [{
      name: "Afiliado",
      hash: "p2",
      offers: [{
        hash: "o3",
        price: 137,
        expedition_checkout_url: "http://checkout.inseguro/e",
      }],
    }],
    coproducer: [{ name: "Sem oferta", hash: "p3" }],
  },
};

test("interpreta vínculos e imagem oficial permitida", () => {
  const parsed = parseLogzzResponse(response);
  assert.equal(parsed.data.producer.length, 1);
  assert.equal(parsed.data.coproducer[0].offers.length, 0);
  assert.equal(parsed.data.producer[0].main_image_url, imageUrl);
});

test("prefere checkout de expedição e rejeita checkout sem HTTPS", () => {
  const candidates = mapLogzzCandidates(parseLogzzResponse(response));
  assert.equal(candidates[0].affiliateUrl, "https://checkout.test/e");
  assert.equal(candidates[2].affiliateUrl, "");
  assert.equal(candidates[2].importable, false);
});

test("aceita preços inteiro e decimal com vírgula sem alterar escala", () => {
  const candidates = mapLogzzCandidates(parseLogzzResponse(response));
  assert.equal(candidates[0].price, 97);
  assert.equal(candidates[1].price, 29.9);
});

test("remove HTML perigoso preservando quebras naturais", () => {
  const description = stripHtml(
    "<p>Primeira linha</p><script>alert(1)</script><p>Segunda linha</p>",
  );
  assert.equal(description, "Primeira linha\nSegunda linha");
  assert.doesNotMatch(description, /script|alert/i);
});

test("imagem ausente ou fora do domínio permitido vira placeholder", () => {
  assert.equal(safeLogzzImageUrl(""), "");
  assert.equal(safeLogzzImageUrl("https://evil.test/image.jpg"), "");
  assert.equal(safeLogzzImageUrl(imageUrl), imageUrl);
});

test("categoria ausente usa padrão e categoria equivalente é reutilizada", () => {
  assert.equal(resolveCategoryName("", []), "Sem categoria");
  assert.equal(
    resolveCategoryName("  SAÚDE e beleza ", ["Saude e Beleza"]),
    "Saude e Beleza",
  );
});

const candidate = mapLogzzCandidates(parseLogzzResponse(response))[0];
test("primeira sincronização cria e segunda atualiza sem duplicar", () => {
  const first = planLogzzSync([candidate], new Set());
  assert.equal(first[0].operation, "create");
  const key = `${candidate.externalProductId}:${candidate.externalOfferId}`;
  const second = planLogzzSync([candidate], new Set([key]));
  assert.equal(second[0].operation, "update");
  assert.equal(new Set([key, key]).size, 1);
});

test("candidatos repetidos no mesmo lote não geram duas criações", () => {
  const plan = planLogzzSync([candidate, candidate], new Set());
  assert.deepEqual(plan.map((item) => item.operation), ["create", "update"]);
});

test("seleciona e desmarca somente itens visíveis", () => {
  const selected = toggleVisibleSelection(new Set(["fora"]), ["a", "b"]);
  assert.deepEqual([...selected].sort(), ["a", "b", "fora"]);
  const cleared = toggleVisibleSelection(selected, ["a", "b"]);
  assert.deepEqual([...cleared], ["fora"]);
});

test("confirmação em massa é obrigatória somente acima de 20 itens", () => {
  assert.equal(requiresLogzzImportConfirmation(20), false);
  assert.equal(requiresLogzzImportConfirmation(21), true);
});

test("filtro por origem mantém integrações independentes", () => {
  const logzz = { source: "logzz" } as Product;
  const manual = { source: "manual" } as Product;
  assert.equal(matchesSourceFilter(logzz, "logzz"), true);
  assert.equal(matchesSourceFilter(manual, "logzz"), false);
  assert.equal(matchesSourceFilter(manual, "all"), true);
});

test("mantém identificadores estáveis por produto e oferta", () => {
  const parsed = parseLogzzResponse(response);
  const first = mapLogzzCandidates(parsed).map((item) => item.id);
  const second = mapLogzzCandidates(parsed).map((item) => item.id);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, first.length);
});

test("rejeita resposta inválida", () =>
  assert.throws(
    () => parseLogzzResponse({ data: null }),
    (error) =>
      error instanceof LogzzError && error.code === "LOGZZ_INVALID_RESPONSE",
  ));

test("rejeita token ausente antes de chamar a rede", async () => {
  let called = false;
  const mockFetch = (async () => {
    called = true;
    return new Response();
  }) as typeof fetch;
  await assert.rejects(
    () => requestLogzzProducts("", "https://api.test", mockFetch),
    (error) =>
      error instanceof LogzzError && error.code === "LOGZZ_NOT_CONFIGURED",
  );
  assert.equal(called, false);
});

test("mapeia HTTP 401 e 429 sem expor token", async () => {
  for (const [status, code] of [
    [401, "LOGZZ_UNAUTHORIZED"],
    [429, "LOGZZ_RATE_LIMITED"],
  ] as const) {
    const mockFetch = (async () =>
      new Response("{}", {
        status,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;
    await assert.rejects(
      () => requestLogzzProducts("segredo", "https://api.test", mockFetch),
      (error) =>
        error instanceof LogzzError &&
        error.code === code &&
        !error.message.includes("segredo"),
    );
  }
});

void (candidate satisfies LogzzImportCandidate);
