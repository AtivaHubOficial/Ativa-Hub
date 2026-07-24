import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { DEFAULT_PLATFORM_SETTINGS, platformSettingsFromRow } from "@/lib/platform-settings";
import type { PlatformSettings } from "@/types/platform-settings";

export async function getPublicPlatformSettings(): Promise<PlatformSettings> {
  const client = createSupabaseBrowserClient();
  if (!client) return DEFAULT_PLATFORM_SETTINGS;
  const { data, error } = await client.from("platform_settings").select("*").eq("id", "public").maybeSingle();
  return error || !data ? DEFAULT_PLATFORM_SETTINGS : platformSettingsFromRow(data);
}

export async function getAdminPlatformSettings(): Promise<PlatformSettings> {
  const response = await fetch("/api/admin/settings", { cache: "no-store" });
  const body = await response.json() as { settings?: PlatformSettings; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar as configurações.");
  return body.settings ?? DEFAULT_PLATFORM_SETTINGS;
}
