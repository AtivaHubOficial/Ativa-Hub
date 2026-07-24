import { LogzzError } from "./errors.ts";
import type {
  LogzzCategory,
  LogzzImportCandidate,
  LogzzOffer,
  LogzzProduct,
  LogzzProductRole,
  LogzzProductsResponse,
  LogzzSpecification,
} from "./types.ts";
import { safeHttpsUrl, safeLogzzImageUrl } from "./validation.ts";

const roles: LogzzProductRole[] = ["producer", "affiliate", "coproducer"];
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => {
  const normalized =
    typeof value === "string" && /^\d+,\d+$/.test(value.trim())
      ? value.replace(",", ".")
      : value;
  const parsed = typeof normalized === "number" ? normalized : Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const records = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => object(item) !== null) as Record<string, unknown>[]
    : [];

export const stripHtml = (value: string) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function parseOffer(value: Record<string, unknown>): LogzzOffer {
  return {
    hash: text(value.hash),
    name: text(value.name),
    price: number(value.price),
    scheduling_checkout_url:
      safeHttpsUrl(value.scheduling_checkout_url) || undefined,
    expedition_checkout_url:
      safeHttpsUrl(value.expedition_checkout_url) || undefined,
    order_bumps: records(value.order_bumps),
    available_coupons: records(value.available_coupons),
  };
}

function parseProduct(value: Record<string, unknown>): LogzzProduct {
  return {
    name: text(value.name),
    hash: text(value.hash),
    description: stripHtml(text(value.description)),
    categories: records(value.categories).map((category) => ({
      name: text(category.name),
      title: text(category.title),
    } satisfies LogzzCategory)),
    warranty_time: number(value.warranty_time) || undefined,
    main_image_url: safeLogzzImageUrl(value.main_image_url) || undefined,
    specifications: records(value.specifications).map((spec) => ({
      name: text(spec.name),
      value: spec.value,
    } satisfies LogzzSpecification)),
    variations: records(value.variations),
    offers: records(value.offers).map(parseOffer).filter((offer) => offer.hash),
  };
}

export function parseLogzzResponse(value: unknown): LogzzProductsResponse {
  const root = object(value);
  const data = object(root?.data);
  if (!root || !data) {
    throw new LogzzError(
      "LOGZZ_INVALID_RESPONSE",
      "A Logzz retornou dados inválidos.",
      502,
    );
  }
  return {
    message: text(root.message),
    data: {
      producer: records(data.producer).map(parseProduct).filter((p) => p.hash),
      affiliate: records(data.affiliate).map(parseProduct).filter((p) => p.hash),
      coproducer: records(data.coproducer).map(parseProduct).filter((p) => p.hash),
    },
  };
}

export function mapLogzzCandidates(
  response: LogzzProductsResponse,
): LogzzImportCandidate[] {
  return roles.flatMap((role) =>
    response.data[role].flatMap((product) =>
      product.offers.map((offer) => {
        const affiliateUrl =
          offer.expedition_checkout_url ??
          offer.scheduling_checkout_url ??
          "";
        const category = product.categories
          .map((item) => item.name || item.title || "")
          .find(Boolean) ?? "";
        return {
          id: `logzz:${role}:${product.hash}:${offer.hash}`,
          role,
          externalProductId: product.hash,
          externalOfferId: offer.hash,
          name: product.name,
          description: product.description,
          category,
          imageUrl: product.main_image_url ?? "",
          price: offer.price,
          affiliateUrl,
          schedulingCheckoutUrl: offer.scheduling_checkout_url,
          expeditionCheckoutUrl: offer.expedition_checkout_url,
          warrantyTime: product.warranty_time,
          offerName: offer.name,
          specifications: Object.fromEntries(
            product.specifications
              .filter((spec) => spec.name)
              .map((spec) => [spec.name!, spec.value]),
          ),
          importable: Boolean(affiliateUrl),
          ...(affiliateUrl
            ? {}
            : { unavailableReason: "Oferta sem checkout disponível." }),
        };
      }),
    ),
  );
}
