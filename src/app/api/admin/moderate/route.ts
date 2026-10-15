import { getSession } from "@/lib/auth";
import { getContext } from "@/lib/catalog";
import { json } from "@/lib/http";
import { store } from "@/lib/store";
import type { ContextStatus } from "@/lib/types";

const ACTIONS: Record<string, ContextStatus> = {
  approve: "approved",
  reject: "rejected",
  recheck: "to_recheck",
};

/** POST /api/admin/moderate { slug, action: approve | reject | recheck | simulate-change } */
export async function POST(req: Request) {
  const user = await getSession();
  if (user?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);
  const { slug, action } = (await req.json().catch(() => ({}))) as { slug?: string; action?: string };
  if (!slug || !action || !(action in ACTIONS || action === "simulate-change")) return json({ error: "slug et action requis" }, 400);
  if (!getContext(slug)) return json({ error: "Contexte introuvable" }, 404);

  const s = store();
  if (action === "simulate-change") {
    // Démo de la veille : on met une empreinte périmée pour que la prochaine vérification voie la doc comme modifiée.
    s.sourceHashes.set(slug, { hash: "empreinte-perimee", checkedAt: Date.now() });
    return json({ ok: true, slug });
  }
  const status = ACTIONS[action];
  s.status.set(slug, status);
  // Ré-approuver efface l'empreinte : la prochaine veille repart d'une nouvelle référence.
  if (status === "approved") s.sourceHashes.delete(slug);
  return json({ ok: true, slug, status });
}
