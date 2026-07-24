"use client";

import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import type { PlatformSettings } from "@/types/platform-settings";

type Props = {
  search?: string;
  onSearch?: (value: string) => void;
  settings: PlatformSettings;
};

export default function Header({ search = "", onSearch, settings }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
          {settings.logoUrl ? <span role="img" aria-label={settings.platformName} className="block h-10 w-44 bg-contain bg-left bg-no-repeat" style={{ backgroundImage: `url("${settings.logoUrl}")` }} /> : <><span className="rounded-lg px-2 py-1" style={{ backgroundColor: settings.accentColor }}>ATIVA</span> HUB</>}
        </Link>

        <div className="order-3 flex w-full flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 md:order-none md:w-auto">
          <Search size={19} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Buscar ofertas, produtos e categorias..."
            className="w-full bg-transparent px-3 py-3 outline-none"
          />
        </div>

        <Link href="/admin" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white">
          <ShieldCheck size={18} /> Painel Admin
        </Link>
      </div>
    </header>
  );
}
