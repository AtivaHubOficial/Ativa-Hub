import { normalizeSlug } from "../types/product-draft.ts";

export const DEFAULT_CATEGORY_NAME = "Geral";

export function cleanCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function categoryKey(value: string): string {
  return normalizeSlug(
    cleanCategoryName(value)
      .replace(/\s*&\s*/g, " e ")
      .replace(/\s+\+\s+/g, " e "),
  );
}

export function categoriesEquivalent(first: string, second: string): boolean {
  return Boolean(categoryKey(first)) && categoryKey(first) === categoryKey(second);
}

export function resolveKnownCategory(
  value: string,
  available: string[],
  fallback = DEFAULT_CATEGORY_NAME,
): string {
  const match = available.find((category) =>
    categoriesEquivalent(category, value),
  );
  return match ?? available.find((category) =>
    categoriesEquivalent(category, fallback),
  ) ?? fallback;
}

export function canDeleteCategory(productCount: number): boolean {
  return Number.isInteger(productCount) && productCount === 0;
}

export function validateCategoryInput(input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? cleanCategoryName(input.name) : "";
  const slug = typeof input.slug === "string" ? normalizeSlug(input.slug) : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const status = input.status === "inactive" ? "inactive" : "active";
  const displayOrder = Number(input.displayOrder ?? 0);
  const errors: string[] = [];
  if (!name) errors.push("Informe o nome da categoria.");
  if (!slug) errors.push("Informe um slug válido.");
  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    errors.push("A ordem deve ser um número inteiro igual ou maior que zero.");
  }
  return {
    valid: errors.length === 0,
    errors,
    value: { name, slug, description, status, displayOrder },
  };
}
