---
slug: africastalking-sms
title: Africa's Talking - Envoi de SMS
type: cursorrules
service: Africa's Talking
pays: [KE, NG, UG, TZ, RW, MW, ZM, CI]
version_api: version1
source_url: https://developers.africastalking.com/docs/sms/sending
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-07
tags: [sms, otp, notification]
category: sms
status: approved
author: Brian Otieno
github: botieno
description: Envoie un SMS en formulaire urlencoded avec le header apiKey et lit les statuts par destinataire.
---

## Authentification

- Header `apiKey: <AT_API_KEY>` (pas `Authorization`).
- Header `Accept: application/json` pour une réponse JSON.

## Endpoints

- Live : `POST https://api.africastalking.com/version1/messaging`
- Sandbox : `POST https://api.sandbox.africastalking.com/version1/messaging`
- Corps `application/x-www-form-urlencoded` : `username`, `to` (numéros E.164 séparés par des virgules), `message`, `from` optionnel.
- Réponse : `SMSMessageData.Recipients[]` avec `number`, `status`, `statusCode`, `messageId`, `cost`.

## Erreurs

- `statusCode: 101` = envoyé. `403` numéro invalide. `405` solde insuffisant.
- `401` clé invalide ou `username` incohérent.

## Webhooks

- Rapports de livraison : configurés dans le dashboard, reçus en `POST` urlencoded avec `id` et `status`.

## Idempotence et limites

- Pas de clé d'idempotence : dédupliquer côté application avant l'envoi.

## Pièges courants

- En sandbox, `username` vaut `sandbox`.
- Le corps n'est pas du JSON.
- Le header est `apiKey`, pas `X-API-Key`.

## Exemple minimal

```ts
export async function sendSms(to: string[], message: string) {
  const body = new URLSearchParams({ username: process.env.AT_USERNAME ?? "sandbox", to: to.join(","), message });
  const res = await fetch("https://api.sandbox.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey: process.env.AT_API_KEY ?? "", Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return res.json();
}
```

## Variables d'environnement

- `AT_USERNAME`
- `AT_API_KEY`
