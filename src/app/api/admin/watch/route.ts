import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { runWatch } from "@/lib/watch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronAllowed(req: Request) {
  const expected = process.env.CRON_SECRET;
  const given = req.headers.get("x-cron-secret");
  if (!expected || !given || expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/** Lance la veille des docs. Autorisé pour les administrateurs, ou pour la tâche planifiée (cron) avec l'en-tête x-cron-secret. */
export async function POST(req: Request) {
  const user = await getSession();
  if (user?.role !== "admin" && !cronAllowed(req)) return json({ error: "Réservé aux administrateurs" }, 403);
  const results = await runWatch();
  return json({ ranAt: new Date().toISOString(), results });
}
