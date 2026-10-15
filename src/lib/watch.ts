import { createHash } from "node:crypto";
import { publicContexts } from "./catalog";
import { store } from "./store";

export interface WatchResult {
  slug: string;
  source_url: string;
  outcome: "baseline" | "unchanged" | "changed" | "unreachable";
  hash?: string;
}

/** Retire le balisage et les parties qui changent à chaque visite, pour ne calculer l'empreinte que sur le texte lisible de la doc. */
function normalize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(nonce|csrf|build|cache)[-_a-z]*=["'][^"']*["']/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Veille d'obsolescence. Télécharge chaque doc officielle, calcule l'empreinte (hash) de son texte
 * et la compare à celle enregistrée. Si elle a changé, le contexte passe en to_recheck.
 * À lancer chaque nuit via cron : curl -X POST $APP_URL/api/admin/watch -H "x-cron-secret: …"
 */
export async function runWatch(): Promise<WatchResult[]> {
  const s = store();
  const list = publicContexts();
  return Promise.all(
    list.map(async (ctx): Promise<WatchResult> => {
      try {
        const res = await fetch(ctx.source_url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "AfriContext-veille/1.0" } });
        if (!res.ok) return { slug: ctx.slug, source_url: ctx.source_url, outcome: "unreachable" };
        const hash = createHash("sha256").update(normalize(await res.text())).digest("hex").slice(0, 16);
        const prev = s.sourceHashes.get(ctx.slug);
        s.sourceHashes.set(ctx.slug, { hash, checkedAt: Date.now() });
        if (!prev) return { slug: ctx.slug, source_url: ctx.source_url, outcome: "baseline", hash };
        if (prev.hash === hash) return { slug: ctx.slug, source_url: ctx.source_url, outcome: "unchanged", hash };
        s.status.set(ctx.slug, "to_recheck");
        return { slug: ctx.slug, source_url: ctx.source_url, outcome: "changed", hash };
      } catch {
        return { slug: ctx.slug, source_url: ctx.source_url, outcome: "unreachable" };
      }
    }),
  );
}
