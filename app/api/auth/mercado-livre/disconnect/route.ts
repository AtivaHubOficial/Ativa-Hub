import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { ML_OAUTH_COOKIE, ML_STATE_COOKIE } from "@/lib/mercado-livre-oauth";

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete(ML_OAUTH_COOKIE);
  response.cookies.delete(ML_STATE_COOKIE);
  return response;
}
