---
slug: mpesa-daraja-stk-push
title: M-Pesa Daraja - STK Push
type: claude_prompt
service: M-Pesa
pays: [KE]
version_api: v1
source_url: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
tested_with: [claude-code]
last_verified_at: 2026-10-05
tags: [fintech, paiement-mobile, kenya, safaricom]
category: paiement
status: approved
author: Wanjiru Kamau
github: wkamau
description: Déclenche une demande de paiement M-Pesa Express sur le téléphone du client et lit le callback stkCallback.
---

## Authentification

- `GET https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials` avec `Authorization: Basic <base64(consumer_key:consumer_secret)>`.
- Appels métier : `Authorization: Bearer <access_token>`.

## Endpoints

- `POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
  - Requis : `BusinessShortCode`, `Password`, `Timestamp`, `TransactionType` (`CustomerPayBillOnline`), `Amount`, `PartyA`, `PartyB`, `PhoneNumber`, `CallBackURL`, `AccountReference`, `TransactionDesc`.
  - `Password` = base64(`BusinessShortCode` + `Passkey` + `Timestamp`).
  - `Timestamp` au format `YYYYMMDDHHmmss`.
  - Réponse : `CheckoutRequestID`, `ResponseCode` (`0` = demande acceptée).

## Erreurs

- `ResponseCode` différent de `0` : demande refusée, lire `errorMessage`.
- Callback `ResultCode: 1032` : annulé par l'utilisateur.

## Webhooks

- Safaricom appelle `CallBackURL` avec `Body.stkCallback` : `CheckoutRequestID`, `ResultCode`, `ResultDesc`, `CallbackMetadata.Item[]`.
- `ResultCode: 0` signifie paiement réussi. `MpesaReceiptNumber` se trouve dans `CallbackMetadata`.

## Idempotence et limites

- Stocker `CheckoutRequestID` pour rapprocher le callback.

## Pièges courants

- `PhoneNumber` et `PartyA` au format `2547XXXXXXXX`, sans `+` ni `0` initial.
- `CallBackURL` doit être public en HTTPS : `localhost` est refusé.
- Le mot de passe n'est pas la `Passkey` seule.

## Exemple minimal

```ts
export function darajaPassword(shortCode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortCode + passkey + timestamp).toString("base64");
}

export function darajaTimestamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
```

## Variables d'environnement

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
