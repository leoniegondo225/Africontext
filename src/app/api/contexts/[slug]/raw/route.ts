import { getContext } from "@/lib/catalog";
import { EXPORT_FILES, exportFor } from "@/lib/spec";
import { logEvent } from "@/lib/persist";
import type { ExportTool } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/contexts/:slug/raw?tool=cursor|claude-code|agents
 * Export en texte brut pour un outil. La CLI envoie l'en-tête x-africontext-cli : ça compte comme une installation.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = getContext(slug);
  if (!ctx || (ctx.status !== "approved" && ctx.status !== "to_recheck")) {
    return new Response(`Contexte introuvable : ${slug}\n`, { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const toolParam = new URL(req.url).searchParams.get("tool") ?? "cursor";
  const tool: ExportTool = toolParam in EXPORT_FILES ? (toolParam as ExportTool) : "cursor";
  if (req.headers.get("x-africontext-cli")) logEvent(slug, "install");

  return new Response(exportFor(tool, ctx), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-AfriContext-File": EXPORT_FILES[tool],
      "X-AfriContext-Status": ctx.status,
      "Cache-Control": "no-store",
    },
  });
}
