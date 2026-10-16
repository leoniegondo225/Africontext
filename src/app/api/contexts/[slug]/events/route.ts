import { getContext } from "@/lib/catalog";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";
import { logEvent } from "@/lib/persist";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit("event:" + clientIp(req) + slug, 20, 60_000)) return tooMany();
  if (!getContext(slug)) return json({ error: "Contexte introuvable" }, 404);
  const body = (await req.json().catch(() => ({}))) as { kind?: string };
  const kind = body.kind === "install" ? "install" : "copy";
  return json(logEvent(slug, kind));
}
