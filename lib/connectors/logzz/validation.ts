const LOGZZ_IMAGE_HOSTS = new Set([
  "logzz-s3.s3.us-east-2.amazonaws.com",
]);

export function safeHttpsUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" && Boolean(parsed.hostname)
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
}

export function safeLogzzImageUrl(value: unknown): string {
  const normalized = safeHttpsUrl(value);
  if (!normalized) return "";
  return LOGZZ_IMAGE_HOSTS.has(new URL(normalized).hostname) ? normalized : "";
}

export function normalizeCategoryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function cleanCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, " ") || "Sem categoria";
}

export function resolveCategoryName(
  value: string,
  existingCategories: string[],
): string {
  const cleaned = cleanCategoryName(value);
  const key = normalizeCategoryKey(cleaned);
  return existingCategories.find(
    (category) => normalizeCategoryKey(category) === key,
  ) ?? cleaned;
}
