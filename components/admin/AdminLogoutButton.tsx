"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
export default function AdminLogoutButton(){const router=useRouter();const[loading,setLoading]=useState(false);const logout=async()=>{const supabase=createSupabaseBrowserClient();if(!supabase)return;setLoading(true);await supabase.auth.signOut();router.replace("/admin/login");router.refresh()};return <button type="button" onClick={logout} disabled={loading} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-white disabled:opacity-60"><LogOut size={18} aria-hidden="true"/>{loading?"Saindo…":"Sair"}</button>}
