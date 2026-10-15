const buckets = new Map<string, { count: number; reset: number }>();

/** Limite de débit par fenêtre de temps fixe, par clé. Renvoie false quand l'appelant a dépassé la limite. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function json(data: unknown, init?: number | ResponseInit) {
  return Response.json(data, typeof init === "number" ? { status: init } : init);
}

export function tooMany() {
  return json({ error: "Trop de requêtes. Réessayez dans une minute." }, 429);
}
