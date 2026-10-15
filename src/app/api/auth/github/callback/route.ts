import { cookies } from "next/headers";
import { SESSION_COOKIE, encodeSession, roleFor, sessionCookieOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get("afx_oauth_state")?.value;
  jar.delete("afx_oauth_state");
  const code = url.searchParams.get("code");
  if (!code || !expected || url.searchParams.get("state") !== expected) {
    return Response.redirect(new URL("/connexion?erreur=etat-invalide", req.url));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
  });
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return Response.redirect(new URL("/connexion?erreur=github", req.url));

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: "Bearer " + access_token, "User-Agent": "africontext" },
  });
  const gh = (await userRes.json()) as { login: string; name?: string; avatar_url: string };

  jar.set(
    SESSION_COOKIE,
    encodeSession({ login: gh.login, name: gh.name ?? gh.login, avatar: gh.avatar_url, role: roleFor(gh.login) }),
    sessionCookieOptions,
  );
  return Response.redirect(new URL("/contribuer", req.url));
}
