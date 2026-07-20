export type ProductStatus = "active" | "draft" | "paused";

export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  fullShipping: boolean;
  freeShipping: boolean;
  installmentText: string;
  imageUrl: string;
  gallery: string[];
  description: string;
  features: string[];
  tags: string[];
  affiliateUrl: string;
  status: ProductStatus;
  createdAt: string;
};
