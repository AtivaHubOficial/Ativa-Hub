import Link from "next/link";
import { ChevronRight } from "lucide-react";
export default function ProductBreadcrumb({ category, title }: { category?: string; title: string }) {
  return <nav aria-label="Navegação estrutural" className="mb-6 overflow-hidden text-sm text-slate-600"><ol className="flex min-w-0 items-center gap-1"><li className="shrink-0"><Link href="/" className="rounded font-bold hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Home</Link></li>{category && <><li aria-hidden="true"><ChevronRight size={15}/></li><li className="max-w-[30%] truncate">{category}</li></>}<li aria-hidden="true"><ChevronRight size={15}/></li><li className="min-w-0 truncate font-medium text-slate-900" aria-current="page">{title}</li></ol></nav>;
}
