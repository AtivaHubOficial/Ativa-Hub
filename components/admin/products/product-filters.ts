import type { Product, ProductSource, ProductStatus } from "@/types/product";

export type FeaturedFilter = "all" | "featured" | "not-featured";
export type StatusFilter = "all" | ProductStatus;
export type SourceFilter = "all" | ProductSource;

export const isFeaturedProduct = (product: Product) => Boolean(product.featured);
export const matchesSourceFilter = (
  product: Product,
  source: SourceFilter,
) => source === "all" || (product.source ?? "manual") === source;
