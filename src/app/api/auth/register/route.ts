import { cookies } from "next/headers";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/http";
import { registerAccount } from "@/lib/users";

/** POST /api/auth/register (formulaire) : nom, email, mot de passe. Crée le compte puis ouvre la session. */
export async function POST(req: Request) {
  const back = (erreur: string) => Response.redirect(new URL(`/connexion?mode=inscription&erreur=${erreur}`, req.url), 303);
  if (!rateLimit("register:" + clientIp(req), 5, 60_000)) return back("trop-de-tentatives");
  const form = await req.formData();
  const result = await registerAccount(String(form.get("nom") ?? ""), String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!result.ok) return back(result.error);
  (await cookies()).set(SESSION_COOKIE, encodeSession(result.user), sessionCookieOptions);
  return Response.redirect(new URL("/contribuer", req.url), 303);
}
