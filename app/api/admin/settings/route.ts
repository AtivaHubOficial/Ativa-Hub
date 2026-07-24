import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  platformSettingsFromRow,
  platformSettingsToRow,
  validatePlatformSettings,
} from "@/lib/platform-settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const client = await createSupabaseServerClient();
  const { data, error } = await client!.from("platform_settings").select("*").eq("id", "public").maybeSingle();
  return NextResponse.json({ settings: error ? DEFAULT_PLATFORM_SETTINGS : platformSettingsFromRow(data) });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const settings = normalizePlatformSettings(body);
  const errors = validatePlatformSettings(settings);
  if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });
  const client = await createSupabaseServerClient();
  const { error } = await client!.from("platform_settings").upsert(platformSettingsToRow(settings), { onConflict: "id" });
  if (error) return NextResponse.json({ error: "Não foi possível salvar as configurações." }, { status: 500 });
  return NextResponse.json({ settings });
}
