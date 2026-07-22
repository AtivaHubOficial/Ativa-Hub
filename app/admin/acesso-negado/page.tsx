import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
export const metadata:Metadata={title:"Acesso negado | Admin Center"};
export default function AccessDeniedPage(){return <main className="grid min-h-screen place-items-center px-5 py-10"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card"><span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-600"><ShieldX size={30}/></span><h1 className="mt-5 text-3xl font-black">Acesso não autorizado</h1><p className="mt-3 leading-7 text-slate-600">Sua sessão é válida, mas esta conta não consta na lista de administradores autorizados.</p><div className="mx-auto mt-6 max-w-xs rounded-xl border border-slate-200 bg-slate-950 p-1 text-left"><AdminLogoutButton/></div></section></main>}
