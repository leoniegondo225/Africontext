import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { VOTER_COOKIE, getSession } from "@/lib/auth";
import { getContext } from "@/lib/catalog";
import { clientIp, json, rateLimit, tooMany } from "@/lib/http";
import { castVote } from "@/lib/persist";

/** Un vote par votant et par contexte : un compte connecté, ou un identifiant anonyme stocké en cookie. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit("vote:" + clientIp(req), 30, 60_000)) return tooMany();
  if (!getContext(slug)) return json({ error: "Contexte introuvable" }, 404);

  const body = (await req.json().catch(() => ({}))) as { value?: number };
  if (body.value !== 1 && body.value !== -1) return json({ error: "value doit valoir 1 ou -1" }, 400);

  const jar = await cookies();
  const user = await getSession();
  let voter = user?.login;
  if (!voter) {
    voter = jar.get(VOTER_COOKIE)?.value;
    if (!voter) {
      voter = "anon-" + randomUUID();
      jar.set(VOTER_COOKIE, voter, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
  }
  const { stats, mine } = castVote(slug, voter, body.value);
  return json({ up: stats.up, down: stats.down, mine });
}
