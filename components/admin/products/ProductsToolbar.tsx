import { Search, X } from "lucide-react";
import type { FeaturedFilter, StatusFilter } from "@/components/admin/products/product-filters";

interface ProductsToolbarProps {
  search: string; category: string; status: StatusFilter; featured: FeaturedFilter; categories: string[]; hasFilters: boolean;
  onSearchChange: (value: string) => void; onCategoryChange: (value: string) => void; onStatusChange: (value: StatusFilter) => void; onFeaturedChange: (value: FeaturedFilter) => void; onClear: () => void;
}

const selectClassName = "min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

export default function ProductsToolbar(props: ProductsToolbarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(250px,1fr)_repeat(3,minmax(150px,auto))_auto]">
      <label className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200"><Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" /><span className="sr-only">Pesquisar produtos</span><input type="search" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Nome, marca ou categoria" className="w-full bg-transparent px-3 text-sm outline-none" /></label>
      <label className="grid gap-1"><span className="sr-only">Filtrar por categoria</span><select value={props.category} onChange={(event) => props.onCategoryChange(event.target.value)} className={selectClassName}><option value="all">Todas as categorias</option>{props.categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
      <label className="grid gap-1"><span className="sr-only">Filtrar por status</span><select value={props.status} onChange={(event) => props.onStatusChange(event.target.value as StatusFilter)} className={selectClassName}><option value="all">Todos os status</option><option value="active">Ativo</option><option value="draft">Rascunho</option><option value="paused">Pausado</option></select></label>
      <label className="grid gap-1"><span className="sr-only">Filtrar por destaque</span><select value={props.featured} onChange={(event) => props.onFeaturedChange(event.target.value as FeaturedFilter)} className={selectClassName}><option value="all">Todos os destaques</option><option value="featured">Em destaque</option><option value="not-featured">Sem destaque</option></select></label>
      <button type="button" onClick={props.onClear} disabled={!props.hasFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><X size={17} aria-hidden="true" /> Limpar filtros</button>
    </div>
  );
}
