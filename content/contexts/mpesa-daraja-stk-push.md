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

```python
import base64
from datetime import datetime

def daraja_password(short_code: str, passkey: str, timestamp: str) -> str:
    return base64.b64encode((short_code + passkey + timestamp).encode()).decode()

def daraja_timestamp(d: datetime | None = None) -> str:
    return (d or datetime.now()).strftime("%Y%m%d%H%M%S")
```

```php
<?php
function darajaPassword(string $shortCode, string $passkey, string $timestamp): string
{
    return base64_encode($shortCode . $passkey . $timestamp);
}

function darajaTimestamp(?DateTimeInterface $d = null): string
{
    return ($d ?? new DateTimeImmutable())->format("YmdHis");
}
```

```cpp
#include <ctime>
#include <string>

std::string base64(const std::string& in) {
    static const char* table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string out;
    unsigned val = 0;
    int bits = -6;
    for (unsigned char c : in) {
        val = ((val << 8) | c) & 0xFFFFF;
        bits += 8;
        while (bits >= 0) {
            out.push_back(table[(val >> bits) & 0x3F]);
            bits -= 6;
        }
    }
    if (bits > -6) out.push_back(table[((val << 8) >> (bits + 8)) & 0x3F]);
    while (out.size() % 4) out.push_back('=');
    return out;
}

std::string darajaPassword(const std::string& shortCode, const std::string& passkey, const std::string& timestamp) {
    return base64(shortCode + passkey + timestamp);
}

std::string darajaTimestamp() {
    std::time_t now = std::time(nullptr);
    std::tm local = *std::localtime(&now);
    char buf[15];
    std::strftime(buf, sizeof buf, "%Y%m%d%H%M%S", &local);
    return buf;
}
```

## Variables d'environnement

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
