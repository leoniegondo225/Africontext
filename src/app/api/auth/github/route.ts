import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { githubConfigured } from "@/lib/auth";

export async function GET(req: Request) {
  if (!githubConfigured()) return Response.redirect(new URL("/connexion?erreur=github-non-configure", req.url));
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("afx_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: (process.env.APP_URL ?? "").startsWith("https://") });
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  url.searchParams.set("redirect_uri", new URL("/api/auth/github/callback", process.env.APP_URL ?? req.url).toString());
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return Response.redirect(url);
}
