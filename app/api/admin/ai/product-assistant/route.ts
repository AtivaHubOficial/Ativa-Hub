import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-authorization";
import { defaultAIProductProvider } from "@/lib/ai-product-assistant";
import type { AIProductBlock, AIProductInput } from "@/types/ai-product-assistant";

const blocks = new Set<AIProductBlock>(["all","title","shortDescription","description","benefits","faq","cta","seo","identity","specifications"]);
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  let body: { input?: AIProductInput; block?: AIProductBlock };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body.input || !cleanTitle(body.input.title) || !blocks.has(body.block ?? "all")) return NextResponse.json({ error: "Informe o nome do produto e um bloco válido." }, { status: 400 });
  const content = await defaultAIProductProvider.generate({ ...body.input, title: cleanTitle(body.input.title) });
  return NextResponse.json({ content, block: body.block ?? "all" });
}
const cleanTitle = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 120) : "";
