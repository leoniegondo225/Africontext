import { cookies } from "next/headers";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/auth";

/**
 * Connexion de démo pour le jury, active seulement si DEMO_LOGIN=1.
 * role=admin ouvre le back-office de modération : à désactiver en production.
 */
export async function POST(req: Request) {
  if (process.env.DEMO_LOGIN !== "1") return Response.json({ error: "Connexion démo désactivée" }, { status: 403 });
  const form = await req.formData();
  const admin = form.get("role") === "admin";
  const login = admin ? "jury-admin" : "jury-demo";
  (await cookies()).set(
    SESSION_COOKIE,
    encodeSession({ login, name: admin ? "Jury (modération)" : "Jury", avatar: "",role: admin ? "admin" : "user" }),
    sessionCookieOptions,
  );
  return Response.redirect(new URL(admin ? "/admin" : "/contribuer", req.url), 303);
}
