import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth";
import { allContexts } from "@/lib/catalog";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";
import { validateSpec } from "@/lib/spec";
import { store } from "@/lib/store";

/**
 * POST /api/submit { raw, dryRun? }
 * Valide le contenu selon la Spec et cherche des secrets (clés API, mots de passe).
 * Une soumission valide est enregistrée « en attente » jusqu'à ce qu'un administrateur l'approuve.
 */
export async function POST(req: Request) {
  if (!rateLimit("submit:" + clientIp(req), 20, 60_000)) return tooMany();
  const { raw, dryRun } = (await req.json().catch(() => ({}))) as { raw?: string; dryRun?: boolean };
  if (typeof raw !== "string" || !raw.trim()) return json({ error: "Contenu vide" }, 400);
  if (raw.length > 60_000) return json({ error: "Contexte trop long (60 000 caractères maximum)" }, 413);

  const report = validateSpec(raw);

  if (report.secrets.length) {
    return json(
      {
        ok: false,
        blocked: "secret",
        message: "Soumission bloquée : une valeur secrète a été détectée. Remplacez-la par le nom de sa variable d'environnement.",
        report,
      },
      422,
    );
  }
  if (!report.ok) {
    return json({ ok: false, blocked: "spec", message: "Le contexte ne respecte pas encore la Spec.", report }, 422);
  }

  const slug = String(report.meta.slug);
  if (allContexts().some((c) => c.slug === slug)) {
    return json(
      { ok: false, blocked: "spec", message: `Le slug « ${slug} » existe déjà.`, report: { ...report, ok: false, issues: [{ field: "slug", message: "Slug déjà utilisé" }] } },
      409,
    );
  }

  if (dryRun) return json({ ok: true, report });

  const user = await getSession();
  if (!user) return json({ ok: false, message: "Connectez-vous avec GitHub pour publier." }, 401);

  store().submissions.unshift({ id: randomUUID(), slug, raw, author: user.login, createdAt: new Date().toISOString() });
  return json({ ok: true, status: "pending", slug, report });
}
