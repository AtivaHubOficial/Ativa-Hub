export type ImportedProduct = {
  source: "Mercado Livre"; sourceId: string; sourceUrl: string; title: string; brand: string; category: string;
  shortDescription: string; description: string; price: number; oldPrice: number | null; images: string[];
  specifications: Array<{ name: string; value: string }>;
};
