import type { Proof } from "./types";

export const PROOFS: Record<string, Proof> = {
  "wave-checkout-api": {
    prompt: "Ajoute un paiement Wave dans ma route Next.js /api/pay.",
    model: "Claude Sonnet, Cursor (agent)",
    without: `export async function POST(req: Request) {
  const { phone, amount } = await req.json();
  const res = await fetch("https://api.wave.com/v1/pay", {
    method: "POST",
    headers: { "X-API-KEY": process.env.WAVE_KEY },
    body: JSON.stringify({
      phone_number: phone,
      amount: amount.toFixed(2),
      currency: "FCFA",
    }),
  });
  const { payment_url } = await res.json();
  return Response.redirect(payment_url);
}`,
    withContext: `export async function POST(req: Request) {
  const { orderId, amount } = await req.json();
  const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.WAVE_API_KEY,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: "XOF",
      client_reference: orderId,
      success_url: APP_URL + "/paiement/succes",
      error_url: APP_URL + "/paiement/erreur",
    }),
  });
  const { wave_launch_url } = await res.json();
  return Response.redirect(wave_launch_url);
}`,
    inventions: [
      { text: "https://api.wave.com/v1/pay", note: "Endpoint inexistant" },
      { text: '"X-API-KEY"', note: "Header inventé" },
      { text: "phone_number", note: "Champ inconnu" },
      { text: "amount.toFixed(2)", note: "Décimales refusées en XOF" },
      { text: '"FCFA"', note: "Devise invalide" },
      { text: "payment_url", note: "Champ absent de la réponse" },
    ],
    fixes: [
      "https://api.wave.com/v1/checkout/sessions",
      "Authorization",
      "Idempotency-Key",
      "String(amount)",
      '"XOF"',
      "client_reference",
      "success_url",
      "error_url",
      "wave_launch_url",
    ],
    withoutResult: "404 Not Found",
    withResult: "200 OK · session cos-18qq5z…",
  },
  "orange-money-webpay": {
    prompt: "Intègre Orange Money Web Payment au Sénégal dans mon backend Node.",
    model: "GPT-4o, Cursor",
    without: `const token = await fetch("https://api.orange.com/oauth/v2/token", {
  method: "POST",
  body: JSON.stringify({ client_id, client_secret }),
});
const pay = await fetch("https://api.orange.com/orange-money/v1/payment", {
  method: "POST",
  body: JSON.stringify({ phone_number: "+221770000000", amount: 5000, currency: "XOF" }),
});`,
    withContext: `const token = await fetch("https://api.orange.com/oauth/v3/token", {
  method: "POST",
  headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
  body: "grant_type=client_credentials",
});
const pay = await fetch("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", {
  method: "POST",
  headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
  body: JSON.stringify({ merchant_key, currency: "OUV", order_id, amount: 5000, return_url, cancel_url, notif_url, lang: "fr", reference: "Boutique" }),
});`,
    inventions: [
      { text: "oauth/v2/token", note: "Version obsolète" },
      { text: "JSON.stringify({ client_id, client_secret })", note: "Identifiants dans le corps" },
      { text: "orange-money/v1/payment", note: "Endpoint inexistant" },
      { text: "phone_number", note: "Champ inconnu" },
    ],
    fixes: ["oauth/v3/token", "grant_type=client_credentials", "orange-money-webpay/dev/v1/webpayment", "merchant_key", '"OUV"', "notif_url"],
    withoutResult: "404 Resource not found",
    withResult: "201 Created · pay_token reçu",
  },
  "fedapay-transactions": {
    prompt: "Crée un lien de paiement FedaPay pour une commande de 2500 XOF.",
    model: "Claude Sonnet, Claude Code",
    without: `const res = await fetch("https://api.fedapay.com/v1/payments", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: JSON.stringify({ amount: 250000, currency: "XOF" }),
});
const { payment_url } = await res.json();`,
    withContext: `const created = await fetch(BASE + "/transactions", {
  method: "POST",
  headers,
  body: JSON.stringify({ description: "Commande 42", amount: 2500, currency: { iso: "XOF" } }),
});
const tx = (await created.json())["v1/transaction"];
const { url } = await (await fetch(BASE + "/transactions/" + tx.id + "/token", { method: "POST", headers })).json();`,
    inventions: [
      { text: "/v1/payments", note: "Endpoint inexistant" },
      { text: "250000", note: "Multiplié par 100 à tort" },
      { text: 'currency: "XOF"', note: "Doit être un objet" },
      { text: "payment_url", note: "Champ inconnu" },
    ],
    fixes: ["/transactions", "amount: 2500", 'currency: { iso: "XOF" }', '["v1/transaction"]', "/token"],
    withoutResult: "404 Not Found",
    withResult: "200 OK · url de paiement",
  },
  "mtn-momo-collection": {
    prompt: "Demande un paiement MTN MoMo de 100 sur le numéro du client (sandbox).",
    model: "Claude Sonnet, Cursor",
    without: `await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1/payments", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: JSON.stringify({ amount: 100, currency: "XOF", phone: msisdn }),
});`,
    withContext: `await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "X-Reference-Id": referenceId, "X-Target-Environment": "sandbox", "Ocp-Apim-Subscription-Key": key },
  body: JSON.stringify({ amount: "100", currency: "EUR", externalId: referenceId, payer: { partyIdType: "MSISDN", partyId: msisdn } }),
});`,
    inventions: [
      { text: "collection/v1/payments", note: "Endpoint inexistant" },
      { text: '"XOF"', note: "Sandbox : EUR uniquement" },
      { text: "phone: msisdn", note: "Champ inconnu" },
    ],
    fixes: ["collection/v1_0/requesttopay", "X-Reference-Id", "X-Target-Environment", "Ocp-Apim-Subscription-Key", '"EUR"', "partyIdType"],
    withoutResult: "404 Resource Not Found",
    withResult: "202 Accepted",
  },
  "paystack-transactions": {
    prompt: "Initialise un paiement Paystack de 5 000 NGN.",
    model: "GPT-4o, Cursor",
    without: `const res = await fetch("https://api.paystack.co/charge/initialize", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: JSON.stringify({ email, amount: 5000 }),
});`,
    withContext: `const res = await fetch("https://api.paystack.co/transaction/initialize", {
  method: "POST",
  headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
  body: JSON.stringify({ email, amount: 5000 * 100, reference: crypto.randomUUID() }),
});`,
    inventions: [
      { text: "charge/initialize", note: "Mauvais endpoint" },
      { text: "amount: 5000 }", note: "50 NGN au lieu de 5 000" },
    ],
    fixes: ["transaction/initialize", "5000 * 100", "reference"],
    withoutResult: "Montant facturé : 50 NGN",
    withResult: "200 OK · authorization_url",
  },
};
