import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import DashboardCard from "@/components/admin/DashboardCard";
import StatusItem from "@/components/admin/StatusItem";
import { money } from "@/lib/data";
import { readAdminDashboard } from "@/lib/admin-dashboard";
import { Boxes, CircleCheckBig, FolderTree, Star } from "lucide-react";

export default async function AdminPage() {
  const dashboard = await readAdminDashboard();
  return <>
    <AdminHeader />
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Admin Center</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Visão geral</h1><p className="mt-2 text-slate-600">Acompanhe o catálogo e a evolução da Ativa Hub em um só lugar.</p></div><span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Dados do Supabase</span></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do catálogo">
        <DashboardCard label="Total de produtos" value={dashboard.totalProducts} detail="Itens persistidos no catálogo" icon={Boxes}/>
        <DashboardCard label="Produtos ativos" value={dashboard.activeProducts} detail="Disponíveis na loja" icon={CircleCheckBig}/>
        <DashboardCard label="Categorias" value={dashboard.totalCategories} detail="Categorias cadastradas" icon={FolderTree}/>
        <DashboardCard label="Produtos em destaque" value={dashboard.featuredProducts} detail="Itens marcados como destaque" icon={Star}/>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-products-title">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Catálogo atual</p><h2 id="recent-products-title" className="mt-1 text-xl font-black">Produtos recentes</h2></div><Link href="/admin/produtos" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Gerenciar</Link></div>
          <div className="divide-y divide-slate-100 px-5 sm:px-6">{dashboard.recentProducts.length ? dashboard.recentProducts.map(product=><article key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[1fr_auto_auto]"><div className="min-w-0"><Link href={`/admin/produtos/${product.id}/editar`} className="block truncate font-bold text-slate-900 hover:text-amber-700">{product.title}</Link><p className="mt-1 truncate text-sm text-slate-500">{product.category} · {product.brand}</p></div><strong className="text-sm text-slate-800">{money(product.price)}</strong><span className="col-start-1 w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 sm:col-start-auto">{product.status==="active"?"Ativo":product.status==="paused"?"Pausado":"Rascunho"}</span></article>) : <p className="py-6 text-sm text-slate-500">Nenhum produto cadastrado.</p>}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="platform-status-title"><div className="border-b border-slate-100 px-5 py-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Acompanhamento</p><h2 id="platform-status-title" className="mt-1 text-xl font-black">Status da plataforma</h2></div><ul className="divide-y divide-slate-100 px-5 sm:px-6"><StatusItem label="Loja pública online" description="Disponível para visitantes" status="Online" tone="online"/><StatusItem label="Catálogo carregado" description={`${dashboard.totalProducts} produtos cadastrados`} status="Pronto" tone="online"/><StatusItem label="Banco de dados" description={`${dashboard.totalCategories} categorias cadastradas`} status="Conectado" tone="online"/></ul></section>
      </div>
    </main>
  </>;
}
