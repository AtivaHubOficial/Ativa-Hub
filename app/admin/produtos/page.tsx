import type { Metadata } from "next";
import ProductsCatalogClient from "@/components/admin/products/ProductsCatalogClient";

export const metadata: Metadata = {
  title: "Produtos | Admin Center",
  description: "Gestão do catálogo de produtos da Ativa Hub.",
};

export default function AdminProductsPage() {
  return <ProductsCatalogClient />;
}
