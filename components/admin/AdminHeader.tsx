import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ativa Hub</p><strong className="text-lg text-slate-900">Painel administrativo</strong></div>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} aria-hidden="true" /> Voltar à loja</Link>
      </div>
    </header>
  );
}
