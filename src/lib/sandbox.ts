import { createHmac, randomBytes } from "node:crypto";

/**
 * Faux serveurs (mocks) pour Wave, Orange Money et FedaPay. Ils acceptent les requêtes
 * documentées, rejettent les requêtes inventées avec une explication, et renvoient le webhook
 * que le vrai service enverrait, signé avec le secret public de la sandbox.
 */
export const SANDBOX_WEBHOOK_SECRET = "africontext-sandbox";

export interface SandboxResult {
  status: number;
  body: unknown;
  webhook?: { event: string; headers: Record<string, string>; body: string };
}

type Handler = (req: { method: string; path: string; headers: Headers; body: string }) => SandboxResult;

const id = (prefix: string) => prefix + randomBytes(8).toString("hex").slice(0, 12);

function parse(body: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(body || "{}");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

function missing(obj: Record<string, unknown>, fields: string[]) {
  return fields.filter((f) => obj[f] === undefined || obj[f] === "");
}

/* ---------------- Wave ---------------- */

const wave: Handler = ({ method, path, headers, body }) => {
  if (/^v1\/(pay|payments?|transactions?|checkout)$/.test(path)) {
    return {
      status: 404,
      body: { code: "not-found", message: `/${path} n'existe pas chez Wave. C'est un endpoint inventé : utilisez POST /v1/checkout/sessions.` },
    };
  }
  const auth = headers.get("authorization") ?? "";
  if (headers.get("x-api-key")) {
    return { status: 401, body: { code: "missing-auth-header", message: "Wave n'utilise pas X-API-KEY. Envoyez Authorization: Bearer <WAVE_API_KEY>." } };
  }
  if (!/^Bearer\s+\S+/.test(auth)) {
    return { status: 401, body: { code: "missing-auth-header", message: "Header Authorization: Bearer manquant." } };
  }

  if (method === "POST" && path === "v1/checkout/sessions") {
    const b = parse(body);
    if (!b) return { status: 400, body: { code: "request-validation-error", message: "Corps JSON invalide." } };
    const errors: string[] = missing(b, ["amount", "currency", "success_url", "error_url"]).map((f) => `${f} est requis`);
    if (b.phone_number !== undefined) errors.push("phone_number n'existe pas dans l'API Checkout (voir restrict_payer_mobile)");
    if (b.amount !== undefined && (typeof b.amount !== "string" || !/^\d+$/.test(b.amount)))
      errors.push('amount doit être une chaîne d\'entier, ex. "1000"');
    if (b.currency !== undefined && b.currency !== "XOF") errors.push(`currency "${String(b.currency)}" inconnue, utilisez "XOF"`);
    for (const k of ["success_url", "error_url"]) {
      if (typeof b[k] === "string" && !String(b[k]).startsWith("https://")) errors.push(`${k} doit être en HTTPS`);
    }
    if (errors.length) return { status: 400, body: { code: "request-validation-error", message: errors.join(" ; "), details: errors } };

    const session = {
      id: id("cos-"),
      amount: b.amount,
      checkout_status: "complete",
      client_reference: b.client_reference ?? null,
      currency: "XOF",
      error_url: b.error_url,
      success_url: b.success_url,
      last_payment_error: null,
      business_name: "Boutique Sandbox",
      payment_status: "succeeded",
      transaction_id: id("T_"),
      wave_launch_url: "https://pay.wave.com/c/" + id("cos-"),
      when_created: new Date().toISOString(),
      when_completed: new Date().toISOString(),
      when_expires: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
    const event = { id: id("EV_"), type: "checkout.session.completed", data: session };
    const raw = JSON.stringify(event);
    const t = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac("sha256", SANDBOX_WEBHOOK_SECRET).update(t + raw).digest("hex");
    return {
      status: 200,
      body: { ...session, checkout_status: "open", payment_status: "processing", when_completed: null },
      webhook: { event: event.type, headers: { "Wave-Signature": `t=${t},v1=${sig}`, "Content-Type": "application/json" }, body: raw },
    };
  }

  return { status: 404, body: { code: "not-found", message: `Aucune route ${method} /${path} dans l'API Wave.` } };
};

/* ---------------- Orange Money ---------------- */

const orange: Handler = ({ method, path, headers, body }) => {
  const auth = headers.get("authorization") ?? "";

  if (method === "POST" && path === "oauth/v3/token") {
    if (!/^Basic\s+\S+/.test(auth)) return { status: 401, body: { error: "invalid_client", error_description: "Authorization: Basic base64(client_id:client_secret) requis." } };
    if (!/grant_type=client_credentials/.test(body))
      return { status: 400, body: { error: "invalid_request", error_description: "Corps attendu : grant_type=client_credentials (form-urlencoded)." } };
    return { status: 200, body: { token_type: "Bearer", access_token: "sandbox-" + randomBytes(12).toString("hex"), expires_in: 7776000 } };
  }
  if (/^oauth\/v[12]\/token$|^token$/.test(path)) {
    return { status: 404, body: { code: 60, message: "Resource not found", description: `/${path} n'existe pas. Le jeton se demande sur /oauth/v3/token.` } };
  }

  if (method === "POST" && path === "orange-money-webpay/dev/v1/webpayment") {
    if (!/^Bearer\s+sandbox-/.test(auth)) return { status: 401, body: { code: 42, message: "Expired credentials", description: "Jeton absent ou invalide. Obtenez-le sur /oauth/v3/token." } };
    const b = parse(body);
    if (!b) return { status: 400, body: { code: 1, message: "Invalid body" } };
    const fields = ["merchant_key", "currency", "order_id", "amount", "return_url", "cancel_url", "notif_url", "lang", "reference"];
    const miss = missing(b, fields);
    const errors = miss.map((f) => `${f} est requis`);
    if (b.phone_number !== undefined) errors.push("phone_number n'existe pas : le client saisit son numéro sur payment_url");
    if (b.currency !== undefined && b.currency !== "OUV") errors.push('En environnement dev, currency vaut "OUV"');
    if (errors.length) return { status: 400, body: { status: 400, message: errors.join(" ; "), details: errors } };

    const notif_token = randomBytes(16).toString("hex");
    const pay_token = randomBytes(24).toString("hex");
    const notification = JSON.stringify({ status: "SUCCESS", notif_token, txnid: "MP" + Date.now() });
    return {
      status: 201,
      body: {
        status: 201,
        message: "OK",
        pay_token,
        payment_url: "https://webpayment-qualif.orange-money.com/payment/pay_token/" + pay_token,
        notif_token,
      },
      webhook: { event: "notification SUCCESS", headers: { "Content-Type": "application/json" }, body: notification },
    };
  }
  if (/^orange-money(-webpay)?\/.*payment/.test(path)) {
    return { status: 404, body: { code: 60, message: "Resource not found", description: `/${path} n'existe pas. Utilisez /orange-money-webpay/dev/v1/webpayment.` } };
  }
  return { status: 404, body: { code: 60, message: "Resource not found" } };
};

/* ---------------- FedaPay ---------------- */

const fedaTx = new Map<number, Record<string, unknown>>();

const fedapay: Handler = ({ method, path, headers, body }) => {
  if (!/^Bearer\s+\S+/.test(headers.get("authorization") ?? "")) {
    return { status: 401, body: { message: "Clé API absente. Envoyez Authorization: Bearer <FEDAPAY_SECRET_KEY>." } };
  }
  if (method === "POST" && path === "v1/transactions") {
    const b = parse(body);
    if (!b) return { status: 422, body: { message: "Corps JSON invalide" } };
    const errors: Record<string, string[]> = {};
    for (const f of missing(b, ["description", "amount", "currency"])) errors[f] = ["est requis"];
    if (typeof b.currency === "string") errors.currency = ['doit être un objet { iso: "XOF" }, pas une chaîne'];
    if (b.amount !== undefined && !Number.isInteger(b.amount)) errors.amount = ["doit être un entier"];
    if (Object.keys(errors).length) return { status: 422, body: { message: "Les données sont invalides", errors } };
    const tx = {
      klass: "v1/transaction",
      id: 100000 + fedaTx.size + Math.floor(Math.random() * 900),
      reference: "trx_" + randomBytes(5).toString("hex"),
      amount: b.amount,
      description: b.description,
      status: "pending",
      currency_id: 1,
      callback_url: b.callback_url ?? null,
      created_at: new Date().toISOString(),
    };
    fedaTx.set(tx.id, tx);
    return { status: 200, body: { "v1/transaction": tx } };
  }
  const tokenMatch = /^v1\/transactions\/(\d+)\/token$/.exec(path);
  if (method === "POST" && tokenMatch) {
    const tx = fedaTx.get(Number(tokenMatch[1]));
    if (!tx) return { status: 404, body: { message: "Transaction introuvable dans cet environnement" } };
    const token = randomBytes(20).toString("hex");
    tx.status = "approved";
    const event = JSON.stringify({ name: "transaction.approved", entity: tx });
    const t = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac("sha256", SANDBOX_WEBHOOK_SECRET).update(t + "." + event).digest("hex");
    return {
      status: 200,
      body: { token, url: "https://sandbox-process.fedapay.com/" + token },
      webhook: { event: "transaction.approved", headers: { "X-FEDAPAY-SIGNATURE": `t=${t},s=${sig}`, "Content-Type": "application/json" }, body: event },
    };
  }
  if (/^v1\/(payments?|checkout)/.test(path)) {
    return { status: 404, body: { message: `/${path} n'existe pas chez FedaPay. Créez une transaction sur /v1/transactions puis son jeton.` } };
  }
  return { status: 404, body: { message: "Route introuvable" } };
};

export const SANDBOXES: Record<string, Handler> = { wave, "orange-money": orange, fedapay };
