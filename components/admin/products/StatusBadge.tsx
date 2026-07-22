import type { ProductStatus } from "@/types/product";

const statusDetails: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
  draft: { label: "Rascunho", className: "bg-slate-100 text-slate-600" },
  paused: { label: "Pausado", className: "bg-amber-100 text-amber-800" },
};

export default function StatusBadge({ status }: { status: ProductStatus }) {
  const detail = statusDetails[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${detail.className}`}>{detail.label}</span>;
}
