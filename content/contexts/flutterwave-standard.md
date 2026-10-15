---
slug: flutterwave-standard
title: Flutterwave - Paiement Standard
type: cursorrules
service: Flutterwave
pays: [NG, GH, KE, UG, CM, SN, CI, RW]
version_api: v3
source_url: https://developer.flutterwave.com/docs
tested_with: [cursor]
last_verified_at: 2026-08-02
tags: [fintech, carte, mobile-money, webhook]
category: paiement
status: to_recheck
author: Amina Bello
github: aminabello
description: Lien de paiement hébergé Flutterwave, vérification par identifiant et header verif-hash. À revérifier depuis le changement de la doc source.
---

## Authentification

- Header `Authorization: Bearer <FLW_SECRET_KEY>`.

## Endpoints

- `POST https://api.flutterwave.com/v3/payments`
  - Requis : `tx_ref`, `amount`, `currency`, `redirect_url`, `customer: { email }`.
  - Réponse : `data.link` vers la page de paiement hébergée.
- `GET https://api.flutterwave.com/v3/transactions/:id/verify` : vérifier `status`, `amount`, `currency` et `tx_ref`.

## Erreurs

- Les réponses contiennent `status` (`success` ou `error`) et `message`.

## Webhooks

- Header `verif-hash` : comparer à votre secret de webhook (`FLW_WEBHOOK_HASH`).
- Événement : `charge.completed`. Toujours revérifier la transaction par son `id`.

## Idempotence et limites

- `tx_ref` unique par commande.

## Pièges courants

- `verif-hash` n'est pas un HMAC : c'est une égalité avec votre secret.
- Vérifier aussi que `amount` et `currency` reçus correspondent à la commande.

## Exemple minimal

```ts
export async function createFlwLink(txRef: string, amount: number, email: string): Promise<string> {
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.FLW_SECRET_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref: txRef, amount, currency: "NGN", redirect_url: process.env.APP_URL + "/retour", customer: { email } }),
  });
  const json = (await res.json()) as { data: { link: string } };
  return json.data.link;
}
```

## Variables d'environnement

- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_HASH`
- `APP_URL`
