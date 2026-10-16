import { cookies } from "next/headers";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/http";
import { verifyAccount } from "@/lib/users";

/** POST /api/auth/login (formulaire) : email et mot de passe. Limité en débit contre le devinage de mots de passe. */
export async function POST(req: Request) {
  if (!rateLimit("login:" + clientIp(req), 8, 60_000)) {
    return Response.redirect(new URL("/connexion?erreur=trop-de-tentatives", req.url), 303);
  }
  const form = await req.formData();
  const user = await verifyAccount(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!user) return Response.redirect(new URL("/connexion?erreur=identifiants", req.url), 303);
  (await cookies()).set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions);
  return Response.redirect(new URL(user.role === "admin" ? "/admin" : "/contribuer", req.url), 303);
}
