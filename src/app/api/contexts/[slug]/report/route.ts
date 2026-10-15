import { getContext } from "@/lib/catalog";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";
import { store } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit("report:" + clientIp(req), 5, 60_000)) return tooMany();
  if (!getContext(slug)) return json({ error: "Contexte introuvable" }, 404);
  const { reason } = (await req.json().catch(() => ({}))) as { reason?: string };
  const text = (reason ?? "").trim().slice(0, 500);
  if (!text) return json({ error: "Indiquez ce qui ne va pas" }, 400);
  store().reports.unshift({ slug, reason: text, at: Date.now() });
  return json({ ok: true });
}
