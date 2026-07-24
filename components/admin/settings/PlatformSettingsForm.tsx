"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getAdminPlatformSettings } from "@/lib/platform-settings-repository";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/platform-settings";
import type { PlatformSettings } from "@/types/platform-settings";

const field = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const section = "rounded-2xl border bg-white p-5 shadow-sm sm:p-6";

export default function PlatformSettingsForm() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    getAdminPlatformSettings()
      .then(setSettings)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = await response.json() as { settings?: PlatformSettings; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar.");
      if (body.settings) setSettings(body.settings);
      setMessage("Configurações salvas com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl p-6">Carregando configurações…</main>;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header><p className="text-sm font-bold uppercase tracking-wider text-amber-600">Admin Center</p><h1 className="mt-1 text-3xl font-black">Configurações</h1><p className="mt-2 text-slate-600">Personalize informações públicas da Ativa Hub sem alterar variáveis de ambiente.</p></header>
      <form onSubmit={submit} className="space-y-6">
        <section className={section}><h2 className="text-lg font-black">Informações gerais</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Text label="Nome da plataforma" value={settings.platformName} maxLength={80} onChange={(value) => set("platformName", value)} />
          <Text label="E-mail de contato" type="email" value={settings.contactEmail} maxLength={160} onChange={(value) => set("contactEmail", value)} />
          <Area label="Descrição curta" value={settings.shortDescription} maxLength={240} onChange={(value) => set("shortDescription", value)} />
          <Text label="WhatsApp" value={settings.whatsapp} maxLength={24} onChange={(value) => set("whatsapp", value)} />
          <Text label="Instagram" type="url" value={settings.instagramUrl} onChange={(value) => set("instagramUrl", value)} />
          <Text label="Facebook" type="url" value={settings.facebookUrl} onChange={(value) => set("facebookUrl", value)} />
        </div></section>
        <section className={section}><h2 className="text-lg font-black">Página inicial</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Area label="Texto principal" value={settings.heroTitle} maxLength={160} onChange={(value) => set("heroTitle", value)} />
          <Area label="Texto secundário" value={settings.heroSubtitle} maxLength={320} onChange={(value) => set("heroSubtitle", value)} />
          <Area label="Aviso sobre sites parceiros" value={settings.partnerNotice} maxLength={400} onChange={(value) => set("partnerNotice", value)} />
          <Text label="Texto do botão principal" value={settings.primaryButtonText} maxLength={40} onChange={(value) => set("primaryButtonText", value)} />
          <Text label="Produtos por página" type="number" value={String(settings.productsPerPage)} onChange={(value) => set("productsPerPage", Number(value))} />
          <Text label="Categoria padrão" value={settings.defaultCategory} maxLength={100} onChange={(value) => set("defaultCategory", value)} />
        </div><div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle label="Mostrar avaliações sem dados" checked={settings.showEmptyRatings} onChange={(value) => set("showEmptyRatings", value)} />
          <Toggle label="Mostrar produtos sem imagem" checked={settings.showProductsWithoutImage} onChange={(value) => set("showProductsWithoutImage", value)} />
          <Toggle label="Mostrar produtos inativos" checked={settings.showInactiveProducts} onChange={(value) => set("showInactiveProducts", value)} />
        </div></section>
        <section className={section}><h2 className="text-lg font-black">Aparência</h2><p className="mt-1 text-sm text-slate-500">Use somente URLs HTTPS de arquivos públicos.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Text label="URL do logotipo" type="url" value={settings.logoUrl} onChange={(value) => set("logoUrl", value)} />
          <Text label="URL da imagem de capa" type="url" value={settings.coverImageUrl} onChange={(value) => set("coverImageUrl", value)} />
          <Text label="URL do favicon" type="url" value={settings.faviconUrl} onChange={(value) => set("faviconUrl", value)} />
          <label className="text-sm font-bold">Cor principal<input type="color" className={`${field} p-1`} value={settings.primaryColor} onChange={(event) => set("primaryColor", event.target.value)} /></label>
          <label className="text-sm font-bold">Cor de destaque<input type="color" className={`${field} p-1`} value={settings.accentColor} onChange={(event) => set("accentColor", event.target.value)} /></label>
        </div></section>
        <section className={section}><h2 className="text-lg font-black">SEO</h2><div className="mt-4 grid gap-4">
          <Text label="Título SEO" value={settings.seoTitle} maxLength={70} onChange={(value) => set("seoTitle", value)} />
          <Area label="Descrição SEO" value={settings.seoDescription} maxLength={160} onChange={(value) => set("seoDescription", value)} />
        </div></section>
        {message ? <p role="status" className="rounded-xl border bg-white p-4 font-bold">{message}</p> : null}
        <div className="flex justify-end"><button disabled={pending} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-400 px-6 font-black disabled:opacity-50"><Save size={18} />{pending ? "Salvando…" : "Salvar configurações"}</button></div>
      </form>
    </main>
  );
}

function Text({ label, value, onChange, type = "text", maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; maxLength?: number }) {
  return <label className="text-sm font-bold">{label}<input type={type} className={field} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Area({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  return <label className="text-sm font-bold sm:col-span-2">{label}<textarea className={`${field} min-h-24 py-3`} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-3 rounded-xl border p-3 text-sm font-bold"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
