---
slug: paystack-transactions
title: Paystack - Initialize et Verify
type: cursorrules
service: Paystack
pays: [NG, GH, ZA, KE, CI]
version_api: v1
source_url: https://paystack.com/docs/api/transaction
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-09
tags: [fintech, carte, nigeria, ghana, webhook]
category: paiement
status: approved
author: Chidi Okafor
github: chidiokafor
description: Initialise une transaction Paystack en sous-unités, vérifie par référence et valide x-paystack-signature en SHA512.
---

## Authentification

- Header `Authorization: Bearer <PAYSTACK_SECRET_KEY>`.
- La clé publique sert uniquement côté navigateur (Popup / Inline).

## Endpoints

- `POST https://api.paystack.co/transaction/initialize`
  - Requis : `email`, `amount` (entier, en sous-unité : kobo, pesewas, centimes).
  - Optionnel : `currency`, `reference`, `callback_url`, `metadata`, `channels`.
  - Réponse : `data.authorization_url`, `data.access_code`, `data.reference`.
- `GET https://api.paystack.co/transaction/verify/:reference` : `data.status` vaut `success`, `failed` ou `abandoned`.

## Erreurs

- Toutes les réponses contiennent `status` (booléen) et `message`.
- `400` champ invalide, `401` clé invalide, `404` référence inconnue.

## Webhooks

- Header `x-paystack-signature` : HMAC-SHA512 du corps brut avec la clé secrète.
- Événement principal : `charge.success`.
- Répondre `200` immédiatement.

## Idempotence et limites

- `reference` unique par transaction : la générer côté serveur.
- Toujours appeler `verify` avant de livrer, même après un webhook.

## Pièges courants

- `amount: 5000` signifie 50 NGN, pas 5000 NGN : multiplier par 100.
- La signature est en SHA512, pas SHA256.
- Il n'y a pas d'endpoint `/charge/initialize` pour ce flux : c'est `/transaction/initialize`.

## Exemple minimal

```ts
type PaystackInit = { status: boolean; data: { authorization_url: string; reference: string } };

export async function initPaystack(email: string, amountMajor: number): Promise<PaystackInit["data"]> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: Math.round(amountMajor * 100), reference: crypto.randomUUID() }),
  });
  const json = (await res.json()) as PaystackInit;
  if (!json.status) throw new Error("Paystack init failed");
  return json.data;
}
```

## Variables d'environnement

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
