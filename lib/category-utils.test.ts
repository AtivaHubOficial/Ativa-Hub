import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteCategory,
  categoriesEquivalent,
  categoryKey,
  DEFAULT_CATEGORY_NAME,
  resolveKnownCategory,
  validateCategoryInput,
} from "./category-utils.ts";
import { normalizeSlug } from "../types/product-draft.ts";

test("gera e normaliza slug sem acentos ou espaços excedentes", () => {
  assert.equal(normalizeSlug("  Máquinas Agrícolas  "), "maquinas-agricolas");
  assert.equal(normalizeSlug("Casa & Jardim"), "casa-jardim");
});

test("normaliza categorias importadas equivalentes", () => {
  assert.equal(categoryKey("Casa e Jardim"), "casa-e-jardim");
  assert.equal(categoryKey(" casa & jardim "), "casa-e-jardim");
  assert.equal(categoriesEquivalent("CASA E JARDIM", "Casa & Jardim"), true);
});

test("usa Geral para categoria importada desconhecida", () => {
  assert.equal(
    resolveKnownCategory("Categoria externa", ["Agro", "Geral"]),
    DEFAULT_CATEGORY_NAME,
  );
});

test("detecta categoria duplicada por caixa, acento ou símbolo", () => {
  const existing = ["Saúde e Beleza", "Casa e Jardim"];
  assert.equal(existing.some((item) => categoriesEquivalent(item, "saude e beleza")), true);
  assert.equal(existing.some((item) => categoriesEquivalent(item, "Casa & Jardim")), true);
});

test("impede exclusão quando há produtos vinculados", () => {
  assert.equal(canDeleteCategory(2), false);
  assert.equal(canDeleteCategory(0), true);
});

test("valida nome, slug e ordem da categoria", () => {
  assert.equal(validateCategoryInput({ name: "  Agro  ", slug: "Ágro", displayOrder: 2 }).valid, true);
  assert.equal(validateCategoryInput({ name: "", slug: "", displayOrder: -1 }).valid, false);
});
