---
slug: mtn-momo-collection
title: MTN MoMo - Collection (Request to Pay)
type: cursorrules
service: MTN MoMo
pays: [CI, CM, GH, UG, BJ, RW, ZM]
version_api: v1_0
source_url: https://momodeveloper.mtn.com/api-documentation
tested_with: [cursor]
last_verified_at: 2026-10-08
tags: [fintech, paiement-mobile, mtn, uuid]
category: paiement
status: approved
author: Kwame Mensah
github: kmensah
description: Demande un paiement MoMo avec X-Reference-Id, puis interroge le statut ou reçoit le callback.
---

## Authentification

- Jeton : `POST https://sandbox.momodeveloper.mtn.com/collection/token/` avec `Authorization: Basic <base64(api_user:api_key)>`.
- Header `Ocp-Apim-Subscription-Key: <clé primaire du produit Collection>` sur tous les appels.
- Appels métier : `Authorization: Bearer <access_token>`.

## Endpoints

- `POST /collection/v1_0/requesttopay`
  - Headers : `X-Reference-Id` (UUID v4 généré par vous), `X-Target-Environment` (`sandbox` ou l'environnement du pays), `X-Callback-Url` optionnel.
  - Corps : `amount` (string), `currency`, `externalId`, `payer: { partyIdType: "MSISDN", partyId }`, `payerMessage`, `payeeNote`.
  - Réponse : `202 Accepted` sans corps.
- `GET /collection/v1_0/requesttopay/:referenceId` renvoie `status` : `PENDING`, `SUCCESSFUL`, `FAILED`.

## Erreurs

- `409` `X-Reference-Id` déjà utilisé : générer un nouvel UUID.
- `400` corps invalide ou `partyId` mal formaté.
- `401` jeton expiré.
- `500` en sandbox avec certains numéros de test : voir les numéros de test documentés.

## Webhooks

- Si `X-Callback-Url` est fourni, MTN appelle cette URL avec le statut final.
- Le callback n'est pas signé : toujours confirmer avec `GET /requesttopay/:referenceId`.

## Idempotence et limites

- `X-Reference-Id` est la clé d'idempotence : un UUID par demande.
- Interroger le statut avec un intervalle croissant, pas en boucle serrée.

## Pièges courants

- En sandbox, la seule devise acceptée est `EUR`.
- La réponse de `requesttopay` est vide : l'identifiant est celui que vous avez envoyé.
- `amount` est une chaîne.
- Pas de `transactionId` renvoyé à la création.

## Exemple minimal

```ts
export async function requestToPay(token: string, msisdn: string, amount: number): Promise<string> {
  const referenceId = crypto.randomUUID();
  const res = await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": process.env.MOMO_TARGET_ENV ?? "sandbox",
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: "EUR",
      externalId: referenceId,
      payer: { partyIdType: "MSISDN", partyId: msisdn },
      payerMessage: "Commande",
      payeeNote: "Commande",
    }),
  });
  if (res.status !== 202) throw new Error("MoMo " + res.status);
  return referenceId;
}
```

## Variables d'environnement

- `MOMO_API_USER`
- `MOMO_API_KEY`
- `MOMO_SUBSCRIPTION_KEY`
- `MOMO_TARGET_ENV`
