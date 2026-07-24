import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DEFAULT_PLATFORM_SETTINGS, platformSettingsFromRow } from "@/lib/platform-settings";

export async function getServerPlatformSettings() {
  const client = await createSupabaseServerClient();
  if (!client) return DEFAULT_PLATFORM_SETTINGS;
  const { data, error } = await client.from("platform_settings").select("*").eq("id", "public").maybeSingle();
  return error || !data ? DEFAULT_PLATFORM_SETTINGS : platformSettingsFromRow(data);
}
