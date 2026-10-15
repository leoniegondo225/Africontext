import { getSession } from "@/lib/auth";
import { draftFromUrl } from "@/lib/draft";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";

/**
 * POST /api/draft { url }
 * Réservé aux utilisateurs connectés et limité en débit, comme l'exige la Spec pour le brouillon assisté par IA.
 * L'URL est seulement analysée, jamais téléchargée côté serveur ici, pour éviter les attaques SSRF.
 */
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
  return json({ draft: draftFromUrl(parsed.toString()) });
}
