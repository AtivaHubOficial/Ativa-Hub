import { SearchX } from "lucide-react";

export default function EmptyProductsState({ onClear }: { onClear: () => void }) {
  return <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-500"><SearchX size={25} aria-hidden="true" /></span><h2 className="mt-4 text-xl font-black text-slate-900">Nenhum produto encontrado</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Tente alterar a pesquisa ou os filtros selecionados para encontrar outros produtos.</p><button type="button" onClick={onClear} className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800">Limpar filtros</button></div></section>;
}
