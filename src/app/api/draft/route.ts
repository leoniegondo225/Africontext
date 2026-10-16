import { getSession } from "@/lib/auth";
import { draftFromUrl } from "@/lib/draft";
import { aiDraftEnabled, draftWithClaude } from "@/lib/draft-ai";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";

/**
 * POST /api/draft { url }
 * Réservé aux utilisateurs connectés et limité en débit, comme l'exige la Spec pour le brouillon assisté par IA.
 * L'URL n'est jamais téléchargée par notre serveur (pas de SSRF) : avec ANTHROPIC_API_KEY, Claude la lit
 * chez Anthropic et remplit le brouillon ; sans clé ou en cas d'échec, on renvoie le squelette à compléter.
 */
export const maxDuration = 180;

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return json({ error: "Connectez-vous pour générer un brouillon." }, 401);
  if (!rateLimit("draft:" + (user.login || clientIp(req)), 6, 60_000)) return tooMany();

  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  let parsed: URL;
  try {
    parsed = new URL(url ?? "");
  } catch {
    return json({ error: "Collez l'URL complète de la documentation, en https://" }, 400);
  }
  if (parsed.protocol !== "https:") return json({ error: "L'URL de la documentation doit être en HTTPS." }, 400);
  if (aiDraftEnabled()) {
    try {
      return json({ draft: await draftWithClaude(parsed), source: "ia" });
    } catch (err) {
      console.error("[draft] brouillon IA impossible, squelette renvoyé :", err);
    }
  }
  return json({ draft: draftFromUrl(parsed.toString()), source: "squelette" });
}
