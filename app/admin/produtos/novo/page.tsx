import type { Metadata } from "next";
import ProductForm from "@/components/admin/products/ProductForm";
export const metadata: Metadata = { title: "Novo produto | Admin Center", description: "Prepare e revise um novo produto da Ativa Hub." };
export default function NewProductPage() { return <ProductForm />; }
