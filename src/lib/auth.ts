import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export interface SessionUser {
  login: string;
  name: string;
  avatar: string;
  role: "user" | "admin";
}

export const SESSION_COOKIE = "afx_session";
export const VOTER_COOKIE = "afx_voter";

// Sans AUTH_SECRET, les sessions sont signées avec une clé aléatoire créée au démarrage :
// elles marchent, mais sont perdues au redémarrage. Définissez AUTH_SECRET sur le serveur.
// La clé est rangée dans globalThis car les routes API et les pages sont compilées à part,
// chacune avec sa propre copie de ce module.
const g = globalThis as unknown as { __afxAuthSecret?: string };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (!g.__afxAuthSecret) {
    g.__afxAuthSecret = randomBytes(32).toString("hex");
    if (process.env.NODE_ENV === "production") {
      console.warn("[auth] AUTH_SECRET absent : clé temporaire générée, les sessions seront perdues au redémarrage.");
    }
  }
  return g.__afxAuthSecret;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, iat: Date.now() })).toString("base64url");
  return payload + "." + sign(payload);
}

export function decodeSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { iat: number };
    if (Date.now() - data.iat > 1000 * 60 * 60 * 24 * 7) return null;
    return { login: data.login, name: data.name, avatar: data.avatar, role: data.role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}

export function roleFor(login: string): "user" | "admin" {
  const admins = (process.env.ADMIN_GITHUB_LOGINS ?? "").split(",").map((s) => s.trim().toLowerCase());
  return admins.includes(login.toLowerCase()) ? "admin" : "user";
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Un cookie « secure » est ignoré en http simple (ex. http://192.168.x.x) : on ne l'active qu'en HTTPS.
  secure: (process.env.APP_URL ?? "").startsWith("https://"),
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
