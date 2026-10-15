---
slug: orange-money-webpay
title: Orange Money - Web Payment
type: cursorrules
service: Orange Money
pays: [SN, CI, ML, CM, BF, GN, MG]
version_api: v1
source_url: https://developer.orange.com/apis/om-webpay
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-10
tags: [fintech, paiement-mobile, orange, oauth]
category: paiement
status: approved
author: Moussa Traoré
github: mtraore-dev
sandbox: orange-money
description: Obtient un jeton OAuth, initie un paiement web Orange Money et valide la notification avec notif_token.
---

## Authentification

- Étape 1 : `POST https://api.orange.com/oauth/v3/token` avec `Authorization: Basic <base64(client_id:client_secret)>`.
- Corps `application/x-www-form-urlencoded` : `grant_type=client_credentials`.
- Réponse : `access_token`, `expires_in` (secondes). Mettre le jeton en cache jusqu'à expiration.
- Étape 2 : `Authorization: Bearer <access_token>` sur les appels Web Payment.

## Endpoints

- `POST https://api.orange.com/orange-money-webpay/dev/v1/webpayment` initie un paiement.
  - Requis : `merchant_key`, `currency`, `order_id`, `amount`, `return_url`, `cancel_url`, `notif_url`, `lang`, `reference`.
  - Réponse `201` : `status`, `message`, `pay_token`, `payment_url`, `notif_token`.
- `POST https://api.orange.com/orange-money-webpay/dev/v1/transactionstatus` avec `order_id`, `amount`, `pay_token`.
- En production, le segment `dev` est remplacé par le code pays du contrat marchand (ex. `cm`, `ml`).

## Erreurs

- `401` jeton expiré : renouveler le jeton puis rejouer une seule fois.
- `400` champ manquant ou `order_id` déjà utilisé.
- `403` application non abonnée à l'API Web Payment.
- `5xx` réessayer avec backoff, en gardant le même `order_id`.

## Webhooks

- Orange appelle `notif_url` en `POST` JSON : `status` (`SUCCESS` ou `FAILED`), `notif_token`, `txnid`.
- Vérifier que `notif_token` est égal à celui reçu à l'initiation et stocké avec la commande.
- Répondre `200` rapidement, traiter ensuite.

## Idempotence et limites

- `order_id` est unique par marchand : le réutiliser pour un nouveau paiement provoque un rejet.
- Le `payment_url` a une durée de vie limitée : en recréer un si le client revient tard.

## Pièges courants

- Le jeton ne vient pas de `/oauth/v2/token` ni de `/token` : c'est `/oauth/v3/token`.
- En environnement `dev`, la devise est `OUV`, pas `XOF`.
- Le `merchant_key` n'est pas le `client_id`.
- Il n'existe pas de champ `phone_number` à l'initiation : le client saisit son numéro sur `payment_url`.
- Le retour sur `return_url` ne prouve pas le paiement. Seule la notification ou `transactionstatus` fait foi.

## Exemple minimal

```ts
type OmInit = { pay_token: string; payment_url: string; notif_token: string };

async function getOrangeToken(): Promise<string> {
  const basic = Buffer.from(process.env.ORANGE_CLIENT_ID + ":" + process.env.ORANGE_CLIENT_SECRET).toString("base64");
  const res = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function initOrangePayment(orderId: string, amount: number): Promise<OmInit> {
  const token = await getOrangeToken();
  const res = await fetch("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_key: process.env.ORANGE_MERCHANT_KEY,
      currency: "OUV",
      order_id: orderId,
      amount,
      return_url: process.env.APP_URL + "/paiement/retour",
      cancel_url: process.env.APP_URL + "/paiement/annule",
      notif_url: process.env.APP_URL + "/api/webhooks/orange",
      lang: "fr",
      reference: "Boutique",
    }),
  });
  if (res.status !== 201) throw new Error("Orange Money " + res.status);
  return res.json();
}
```

## Variables d'environnement

- `ORANGE_CLIENT_ID`
- `ORANGE_CLIENT_SECRET`
- `ORANGE_MERCHANT_KEY`
- `APP_URL`
