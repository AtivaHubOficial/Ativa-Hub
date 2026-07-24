"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FolderSearch, FolderTree, Handshake, LayoutDashboard, Settings } from "lucide-react";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", available: true },
  { label: "Produtos", icon: Boxes, href: "/admin/produtos", available: true },
  { label: "Discovery", icon: FolderSearch, href: "/admin/discovery", available: true },
  { label: "Categorias", icon: FolderTree, href: "/admin/categorias", available: true },
  { label: "Parceiros", icon: Handshake, href: "/admin/parceiros", available: true },
  { label: "Configurações", icon: Settings, href: "/admin/configuracoes", available: true },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-slate-950 px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:px-5 lg:py-7">
      <Link href="/admin" className="inline-flex items-center text-xl font-black tracking-tight"><span className="rounded-lg bg-ativa-yellow px-2 py-1 text-slate-950">ATIVA</span><span className="ml-2">HUB</span></Link>
      <p className="mb-2 mt-6 hidden text-xs font-bold uppercase tracking-widest text-slate-500 lg:block">Navegação</p>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:grid" aria-label="Navegação administrativa">
        {navigation.map(({ label, icon: Icon, ...item }) => item.available ? (() => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={label} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold ${active ? "bg-slate-800 text-white ring-1 ring-amber-400/50" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}><Icon size={18} className={active ? "text-ativa-yellow" : ""} aria-hidden="true" />{label}</Link>; })() : <span key={label} aria-disabled="true" className="flex min-h-11 shrink-0 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400"><Icon size={18} aria-hidden="true" />{label}<small className="ml-auto hidden rounded-full border border-slate-700 px-2 py-0.5 text-[10px] lg:inline">Em breve</small></span>)}
      </nav>
      <div className="mt-3 lg:absolute lg:bottom-6 lg:left-5 lg:right-5"><div className="mb-2 hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:block"><span className="text-xs font-black text-ativa-yellow">ACESSO PROTEGIDO</span><p className="mt-2 text-sm text-slate-400">Sessão administrativa verificada pelo Supabase.</p></div><AdminLogoutButton/></div>
    </aside>
  );
}
