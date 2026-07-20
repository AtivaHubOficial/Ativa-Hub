import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ativa Hub — Ofertas selecionadas",
  description: "Vitrine independente de produtos e ofertas selecionadas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
