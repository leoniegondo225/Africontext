import { clientIp, rateLimit, tooMany } from "@/lib/http";
import { SANDBOXES } from "@/lib/sandbox";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ service: string; path: string[] }> };

/**
 * /api/sandbox/:service/... répond comme la vraie API. Faites pointer l'URL de base
 * de votre code ici. Le webhook que le vrai service enverrait revient dans l'en-tête
 * X-Sandbox-Webhook (JSON en base64), pour que le corps de la réponse reste identique.
 */
async function handle(req: Request, { params }: Ctx) {
  if (!rateLimit("sandbox:" + clientIp(req), 120, 60_000)) return tooMany();
  const { service, path } = await params;
  const handler = SANDBOXES[service];
  if (!handler) return Response.json({ error: `Sandbox inconnue : ${service}. Disponibles : ${Object.keys(SANDBOXES).join(", ")}` }, { status: 404 });

  const body = req.method === "GET" || req.method === "HEAD" ? "" : await req.text();
  const result = handler({ method: req.method, path: path.join("/"), headers: req.headers, body });
  const headers = new Headers({ "Content-Type": "application/json", "X-Sandbox": "africontext" });
  if (result.webhook) headers.set("X-Sandbox-Webhook", Buffer.from(JSON.stringify(result.webhook)).toString("base64"));
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
