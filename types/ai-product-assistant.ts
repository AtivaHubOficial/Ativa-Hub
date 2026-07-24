export type AIProductBlock = "all" | "title" | "shortDescription" | "description" | "benefits" | "faq" | "cta" | "seo" | "identity" | "specifications";
export type AIProductInput = {
  title: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  source?: string;
  productUrl?: string;
  categories?: string[];
  specifications?: Array<{ name: string; value: string }>;
};
export type AIProductContent = {
  title: string;
  slug: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  cta: string;
  metaTitle: string;
  metaDescription: string;
  openGraphDescription: string;
  keywords: string[];
  specifications: Array<{ name: string; value: string }>;
  provider: "template";
};
