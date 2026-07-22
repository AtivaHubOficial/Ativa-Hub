import type { Product, ProductStatus } from "@/types/product";

export type FeaturedFilter = "all" | "featured" | "not-featured";
export type StatusFilter = "all" | ProductStatus;

export const isFeaturedProduct = (product: Product) => Boolean(product.featured);
