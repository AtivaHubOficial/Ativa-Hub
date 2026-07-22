import type { LucideIcon } from "lucide-react";

interface DashboardCardProps { label: string; value: number; detail: string; icon: LucideIcon; }

export default function DashboardCard({ label, value, detail, icon: Icon }: DashboardCardProps) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-500">{label}</span><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Icon size={20} aria-hidden="true" /></span></div><strong className="mt-4 block text-3xl font-black text-slate-900">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}
