---
slug: wave-checkout-api
title: Wave - API Checkout
type: cursorrules
service: Wave
pays: [SN, CI, ML, BF, GM, UG]
version_api: v1
source_url: https://docs.wave.com/checkout
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-12
tags: [fintech, paiement-mobile, checkout, webhook]
category: paiement
status: approved
author: Awa Ndiaye
github: awandiaye
sandbox: wave
description: Crée une session de paiement Wave, redirige le client vers wave_launch_url et confirme le paiement par webhook signé.
---

## Authentification

- Header `Authorization: Bearer <WAVE_API_KEY>` sur chaque requête.
- Une clé API est liée à une seule API (Checkout, Payout, Balance). Une clé Checkout ne sert pas pour Payout.
- `Content-Type: application/json`.
- Toujours lire la clé depuis `process.env.WAVE_API_KEY`. Jamais de valeur en dur.

## Endpoints

- `POST https://api.wave.com/v1/checkout/sessions` crée une session.
  - Requis : `amount` (string, ex. `"1000"`), `currency` (`"XOF"`), `success_url`, `error_url` (HTTPS).
  - Optionnel : `client_reference` (votre identifiant de commande), `restrict_payer_mobile` (format E.164).
  - Réponse : `id` (préfixe `cos-`), `wave_launch_url`, `checkout_status`, `payment_status`, `when_expires`.
- `GET https://api.wave.com/v1/checkout/sessions/:id` lit une session.
- `POST https://api.wave.com/v1/checkout/sessions/:id/expire` expire une session ouverte.
- `POST https://api.wave.com/v1/checkout/sessions/:id/refund` rembourse une session payée.

## Erreurs

- `400` corps invalide : le JSON contient `code` et `message`. Corriger la requête, ne pas réessayer telle quelle.
- `401` clé absente ou invalide.
- `403` clé valide mais pas pour cette API.
- `404` session inconnue.
- `429` trop de requêtes : réessayer avec backoff exponentiel.
- `5xx` réessayer avec la même `Idempotency-Key`.

## Webhooks

- Événements : `checkout.session.completed`, `checkout.session.payment_failed`.
- Header `Wave-Signature: t=<timestamp>,v1=<signature>`.
- Signature : HMAC-SHA256 de `timestamp + corps brut` avec `WAVE_WEBHOOK_SECRET`, comparée en temps constant.
- Lire le corps brut (`await req.text()`) avant tout `JSON.parse`.

## Idempotence et limites

- Envoyer `Idempotency-Key: <uuid>` sur chaque `POST` pour éviter les doubles sessions.
- Une session expire : vérifier `when_expires` avant de rediriger.
- Gérer `429` avec backoff, pas de boucle serrée.

## Pièges courants

- `/v1/pay`, `/v1/payments` et `/v1/transactions` n'existent pas. Le seul point d'entrée est `/v1/checkout/sessions`.
- `amount` est une chaîne sans décimales pour le XOF : `"1000"`, pas `1000.00`.
- La devise est `XOF`, jamais `FCFA` ni `CFA`.
- Pas de header `X-API-KEY` : c'est `Authorization: Bearer`.
- Ne pas inventer de domaine `sandbox.wave.com` : tester contre la sandbox AfriContext.
- Le paiement n'est confirmé que par le webhook, pas par l'arrivée sur `success_url`.

## Exemple minimal

```ts
type WaveSession = {
  id: string;
  wave_launch_url: string;
  checkout_status: "open" | "complete" | "expired";
  payment_status: "processing" | "cancelled" | "succeeded";
};

export async function createWaveCheckout(orderId: string, amountXof: number): Promise<WaveSession> {
  const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.WAVE_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: String(Math.round(amountXof)),
      currency: "XOF",
      client_reference: orderId,
      success_url: process.env.APP_URL + "/paiement/succes",
      error_url: process.env.APP_URL + "/paiement/erreur",
    }),
  });
  if (!res.ok) throw new Error("Wave " + res.status + ": " + (await res.text()));
  return res.json();
}
```

## Variables d'environnement

- `WAVE_API_KEY`
- `WAVE_WEBHOOK_SECRET`
- `APP_URL`
