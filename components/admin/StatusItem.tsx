type StatusTone = "online" | "progress" | "pending";
interface StatusItemProps { label: string; description: string; status: string; tone: StatusTone; }
const tones: Record<StatusTone, string> = { online: "bg-emerald-100 text-emerald-700", progress: "bg-amber-100 text-amber-800", pending: "bg-slate-100 text-slate-600" };
const dots: Record<StatusTone, string> = { online: "bg-emerald-500", progress: "bg-amber-500", pending: "bg-slate-400" };

export default function StatusItem({ label, description, status, tone }: StatusItemProps) {
  return <li className="grid grid-cols-[10px_1fr] items-center gap-x-3 gap-y-2 py-4"><span className={`size-2 rounded-full ${dots[tone]}`} aria-hidden="true" /><div><strong className="text-sm text-slate-800">{label}</strong><p className="mt-0.5 text-xs text-slate-500">{description}</p></div><span className={`col-start-2 w-fit rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{status}</span></li>;
}
