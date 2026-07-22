"use client";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
export default function AdminShell({children}:{children:React.ReactNode}){const pathname=usePathname();if(pathname==="/admin/login"||pathname==="/admin/acesso-negado")return <div className="min-h-screen bg-slate-100">{children}</div>;return <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[260px_1fr]"><AdminSidebar/><div className="min-w-0">{children}</div></div>}
