import type { Metadata } from "next";
import { getServerPlatformSettings } from "@/lib/platform-settings-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerPlatformSettings();
  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
