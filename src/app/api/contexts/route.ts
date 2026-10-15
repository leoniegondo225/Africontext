import { searchContexts } from "@/lib/catalog";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";

export const dynamic = "force-dynamic";

/** API publique de recherche, utilisée par la CLI et le serveur MCP. */
export async function GET(req: Request) {
  if (!rateLimit("search:" + clientIp(req), 60, 60_000)) return tooMany();
  const url = new URL(req.url);
  const results = searchContexts({
    q: url.searchParams.get("q") ?? undefined,
    pays: url.searchParams.get("pays") ?? undefined,
    category: url.searchParams.get("categorie") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  return json({
    count: results.length,
    results: results.map((c) => ({
      slug: c.slug,
      title: c.title,
      service: c.service,
      type: c.type,
      pays: c.pays,
      tags: c.tags,
      status: c.status,
      version_api: c.version_api,
      source_url: c.source_url,
      last_verified_at: c.last_verified_at,
      installs: c.stats.installs,
      raw: `/api/contexts/${c.slug}/raw`,
    })),
  });
}
