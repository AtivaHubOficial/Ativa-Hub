import type { PlatformSettings } from "../types/platform-settings.ts";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: "Ativa Hub",
  shortDescription: "Vitrine independente de produtos e ofertas selecionadas.",
  heroTitle: "Ofertas úteis para quem vive o campo e a cidade.",
  heroSubtitle: "Produtos selecionados com foco em agro, ferramentas, tecnologia e rotina profissional.",
  contactEmail: "",
  whatsapp: "",
  instagramUrl: "",
  facebookUrl: "",
  partnerNotice: "A compra é finalizada no site parceiro. Preço e disponibilidade são confirmados no destino.",
  primaryButtonText: "Ver ofertas",
  productsPerPage: 24,
  defaultCategory: "Todos",
  showEmptyRatings: false,
  showProductsWithoutImage: true,
  showInactiveProducts: false,
  seoTitle: "Ativa Hub — Ofertas selecionadas",
  seoDescription: "Vitrine independente de produtos e ofertas selecionadas.",
  logoUrl: "",
  coverImageUrl: "",
  faviconUrl: "",
  primaryColor: "#0f172a",
  accentColor: "#facc15",
};

const limits: Partial<Record<keyof PlatformSettings, number>> = {
  platformName: 80,
  shortDescription: 240,
  heroTitle: 160,
  heroSubtitle: 320,
  contactEmail: 160,
  partnerNotice: 400,
  primaryButtonText: 40,
  seoTitle: 70,
  seoDescription: 160,
};

export function sanitizePlainText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeWhatsapp(value: unknown): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export function safePublicUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function clampProductsPerPage(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_PLATFORM_SETTINGS.productsPerPage;
  return Math.min(60, Math.max(4, parsed));
}

export function safeColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
}

export function normalizePlatformSettings(input: unknown): PlatformSettings {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const result = { ...DEFAULT_PLATFORM_SETTINGS };
  for (const key of Object.keys(limits) as Array<keyof typeof limits>) {
    const maximum = limits[key]!;
    (result as unknown as Record<string, unknown>)[key] =
      sanitizePlainText(source[key], maximum) || result[key];
  }
  result.whatsapp = normalizeWhatsapp(source.whatsapp);
  result.instagramUrl = safePublicUrl(source.instagramUrl);
  result.facebookUrl = safePublicUrl(source.facebookUrl);
  result.logoUrl = safePublicUrl(source.logoUrl);
  result.coverImageUrl = safePublicUrl(source.coverImageUrl);
  result.faviconUrl = safePublicUrl(source.faviconUrl);
  result.productsPerPage = clampProductsPerPage(source.productsPerPage);
  result.defaultCategory = sanitizePlainText(source.defaultCategory, 100) || "Todos";
  result.showEmptyRatings = source.showEmptyRatings === true;
  result.showProductsWithoutImage = source.showProductsWithoutImage !== false;
  result.showInactiveProducts = source.showInactiveProducts === true;
  result.primaryColor = safeColor(source.primaryColor, result.primaryColor);
  result.accentColor = safeColor(source.accentColor, result.accentColor);
  return result;
}

export function validatePlatformSettings(settings: PlatformSettings): string[] {
  const errors: string[] = [];
  if (!settings.platformName) errors.push("Informe o nome da plataforma.");
  if (!settings.heroTitle) errors.push("Informe o texto principal.");
  if (settings.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) {
    errors.push("Informe um e-mail válido.");
  }
  if (settings.seoTitle.length > 70) errors.push("O título SEO deve ter no máximo 70 caracteres.");
  if (settings.seoDescription.length > 160) errors.push("A descrição SEO deve ter no máximo 160 caracteres.");
  return errors;
}

export function platformSettingsFromRow(row: Record<string, unknown> | null | undefined) {
  if (!row) return DEFAULT_PLATFORM_SETTINGS;
  return normalizePlatformSettings({
    platformName: row.platform_name,
    shortDescription: row.short_description,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    contactEmail: row.contact_email,
    whatsapp: row.whatsapp,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    partnerNotice: row.partner_notice,
    primaryButtonText: row.primary_button_text,
    productsPerPage: row.products_per_page,
    defaultCategory: row.default_category,
    showEmptyRatings: row.show_empty_ratings,
    showProductsWithoutImage: row.show_products_without_image,
    showInactiveProducts: row.show_inactive_products,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    faviconUrl: row.favicon_url,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
  });
}

export function platformSettingsToRow(settings: PlatformSettings) {
  return {
    id: "public",
    platform_name: settings.platformName,
    short_description: settings.shortDescription,
    hero_title: settings.heroTitle,
    hero_subtitle: settings.heroSubtitle,
    contact_email: settings.contactEmail || null,
    whatsapp: settings.whatsapp || null,
    instagram_url: settings.instagramUrl || null,
    facebook_url: settings.facebookUrl || null,
    partner_notice: settings.partnerNotice,
    primary_button_text: settings.primaryButtonText,
    products_per_page: settings.productsPerPage,
    default_category: settings.defaultCategory,
    show_empty_ratings: settings.showEmptyRatings,
    show_products_without_image: settings.showProductsWithoutImage,
    show_inactive_products: settings.showInactiveProducts,
    seo_title: settings.seoTitle,
    seo_description: settings.seoDescription,
    logo_url: settings.logoUrl || null,
    cover_image_url: settings.coverImageUrl || null,
    favicon_url: settings.faviconUrl || null,
    primary_color: settings.primaryColor,
    accent_color: settings.accentColor,
    updated_at: new Date().toISOString(),
  };
}
