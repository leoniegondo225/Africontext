---
slug: orange-sms-api
title: Orange - SMS API (Afrique)
type: claude_prompt
service: Orange SMS
pays: [SN, CI, CM, ML, BF, GN, MG]
version_api: v1
source_url: https://developer.orange.com/apis/sms
tested_with: [claude-code]
last_verified_at: 2026-10-03
tags: [sms, orange, otp, oauth]
category: sms
status: approved
author: Fatou Diop
github: fatoudiop
description: Envoie un SMS via l'API Orange en encodant l'adresse expéditeur dans le chemin.
---

## Authentification

- Même jeton OAuth que les autres APIs Orange : `POST https://api.orange.com/oauth/v3/token` avec `Authorization: Basic <base64(client_id:client_secret)>`.
- Appels : `Authorization: Bearer <access_token>`.

## Endpoints

- `POST https://api.orange.com/smsmessaging/v1/outbound/{senderAddress}/requests`
  - `senderAddress` est encodé dans le chemin : `tel%3A%2B2210000` pour `tel:+2210000`.
  - Corps : `outboundSMSMessageRequest: { address, senderAddress, outboundSMSTextMessage: { message } }`.
  - Réponse `201` avec la ressource créée.

## Erreurs

- `401` jeton expiré.
- `403` plus de crédit SMS dans le bundle.
- `400` adresse mal formée.

## Webhooks

- Accusés de réception : abonnement séparé, livrés sur l'URL déclarée.

## Idempotence et limites

- Le bundle SMS est décompté à chaque envoi : dédupliquer avant l'appel.

## Pièges courants

- `address` et `senderAddress` sont au format `tel:+221...`, pas un numéro nu.
- Le `senderAddress` du chemin doit être encodé en URL.
- Pas de champ `to` ni `text` : la structure est imbriquée.

## Exemple minimal

```ts
export async function sendOrangeSms(token: string, to: string, message: string) {
  const sender = "tel:+" + process.env.ORANGE_SMS_SENDER;
  const url = "https://api.orange.com/smsmessaging/v1/outbound/" + encodeURIComponent(sender) + "/requests";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      outboundSMSMessageRequest: { address: "tel:" + to, senderAddress: sender, outboundSMSTextMessage: { message } },
    }),
  });
  if (res.status !== 201) throw new Error("Orange SMS " + res.status);
}
```

## Variables d'environnement

- `ORANGE_CLIENT_ID`
- `ORANGE_CLIENT_SECRET`
- `ORANGE_SMS_SENDER`
