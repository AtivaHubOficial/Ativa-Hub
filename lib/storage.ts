"use client";

import { Product } from "@/types/product";
import { seedProducts } from "@/lib/data";

const KEY = "ativa-hub-v2-products";

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return seedProducts;
  const stored = localStorage.getItem(KEY);
  if (!stored) {
    localStorage.setItem(KEY, JSON.stringify(seedProducts));
    return seedProducts;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return seedProducts;
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(KEY, JSON.stringify(products));
}
