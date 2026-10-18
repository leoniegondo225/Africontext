---
slug: cinetpay-checkout
title: CinetPay - Guichet de paiement
type: cursorrules
service: CinetPay
pays: [CI, SN, CM, BF, ML, TG, BJ, GN, CD]
version_api: v2
source_url: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-06
tags: [fintech, paiement-mobile, cote-d-ivoire, guichet]
category: paiement
status: approved
author: Yao Kouassi
github: yaokouassi
description: Initialise un paiement CinetPay, redirige vers payment_url et confirme par /payment/check après la notification.
---

## Authentification

- Pas de header d'authentification : `apikey` et `site_id` sont envoyés dans le corps JSON.
- Les lire depuis l'environnement côté serveur uniquement.

## Endpoints

- `POST https://api-checkout.cinetpay.com/v2/payment`
  - Requis : `apikey`, `site_id`, `transaction_id`, `amount`, `currency`, `description`, `notify_url`, `return_url`, `channels`.
  - Réponse : `code: "201"`, `data.payment_token`, `data.payment_url`.
- `POST https://api-checkout.cinetpay.com/v2/payment/check` avec `apikey`, `site_id`, `transaction_id`.
  - `data.status` : `ACCEPTED`, `REFUSED`, `PENDING`.

## Erreurs

- Le champ `code` est une chaîne : `"201"` succès, `"600"` erreur de paramètre, `"609"` authentification.
- Le statut HTTP peut être `200` même en cas d'erreur : lire `code`.

## Webhooks

- CinetPay appelle `notify_url` en `POST` formulaire avec `cpm_trans_id` et `cpm_site_id`.
- Header `x-token` : HMAC de contrôle, à vérifier avec la clé secrète du compte.
- Toujours confirmer avec `/v2/payment/check` avant de livrer.

## Idempotence et limites

- `transaction_id` unique par paiement.

## Pièges courants

- `amount` doit être un multiple de 5 pour le XOF.
- `channels` vaut `ALL`, `MOBILE_MONEY`, `CREDIT_CARD` ou `WALLET`.
- Le succès est `code === "201"`, pas `res.ok`.

## Exemple minimal

```ts
export async function initCinetPay(transactionId: string, amount: number): Promise<string> {
  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: Math.ceil(amount / 5) * 5,
      currency: "XOF",
      description: "Commande " + transactionId,
      notify_url: process.env.APP_URL + "/api/webhooks/cinetpay",
      return_url: process.env.APP_URL + "/paiement/retour",
      channels: "ALL",
    }),
  });
  const json = (await res.json()) as { code: string; data: { payment_url: string } };
  if (json.code !== "201") throw new Error("CinetPay " + json.code);
  return json.data.payment_url;
}
```

```python
# pip install requests
import math
import os
import requests

def init_cinetpay(transaction_id: str, amount: int) -> str:
    app_url = os.environ["APP_URL"]
    res = requests.post(
        "https://api-checkout.cinetpay.com/v2/payment",
        json={
            "apikey": os.environ["CINETPAY_API_KEY"],
            "site_id": os.environ["CINETPAY_SITE_ID"],
            "transaction_id": transaction_id,
            "amount": math.ceil(amount / 5) * 5,
            "currency": "XOF",
            "description": "Commande " + transaction_id,
            "notify_url": app_url + "/api/webhooks/cinetpay",
            "return_url": app_url + "/paiement/retour",
            "channels": "ALL",
        },
        timeout=15,
    )
    body = res.json()
    if body.get("code") != "201":
        raise RuntimeError(f"CinetPay {body.get('code')}")
    return body["data"]["payment_url"]
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function initCinetPay(string $transactionId, int $amount): string
{
    $appUrl = getenv("APP_URL");
    $res = (new Client(["timeout" => 15, "http_errors" => false]))->post("https://api-checkout.cinetpay.com/v2/payment", [
        "json" => [
            "apikey" => getenv("CINETPAY_API_KEY"),
            "site_id" => getenv("CINETPAY_SITE_ID"),
            "transaction_id" => $transactionId,
            "amount" => (int) (ceil($amount / 5) * 5),
            "currency" => "XOF",
            "description" => "Commande " . $transactionId,
            "notify_url" => $appUrl . "/api/webhooks/cinetpay",
            "return_url" => $appUrl . "/paiement/retour",
            "channels" => "ALL",
        ],
    ]);
    $body = json_decode((string) $res->getBody(), true);
    if (($body["code"] ?? null) !== "201") {
        throw new RuntimeException("CinetPay " . ($body["code"] ?? $res->getStatusCode()));
    }
    return $body["data"]["payment_url"];
}
```

```cpp
// vcpkg install cpr nlohmann-json
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <cstdlib>
#include <stdexcept>
#include <string>

using json = nlohmann::json;

static std::string env(const char* name) {
    const char* v = std::getenv(name);
    if (!v) throw std::runtime_error(std::string("Variable d'environnement manquante : ") + name);
    return v;
}

std::string initCinetPay(const std::string& transactionId, long amount) {
    const std::string appUrl = env("APP_URL");
    auto res = cpr::Post(
        cpr::Url{"https://api-checkout.cinetpay.com/v2/payment"},
        cpr::Header{{"Content-Type", "application/json"}},
        cpr::Body{json{
            {"apikey", env("CINETPAY_API_KEY")},
            {"site_id", env("CINETPAY_SITE_ID")},
            {"transaction_id", transactionId},
            {"amount", (amount + 4) / 5 * 5},  // multiple de 5 supérieur
            {"currency", "XOF"},
            {"description", "Commande " + transactionId},
            {"notify_url", appUrl + "/api/webhooks/cinetpay"},
            {"return_url", appUrl + "/paiement/retour"},
            {"channels", "ALL"},
        }.dump()},
        cpr::Timeout{15000});
    const auto body = json::parse(res.text);
    if (body.value("code", "") != "201") throw std::runtime_error("CinetPay " + body.value("code", std::to_string(res.status_code)));
    return body["data"]["payment_url"].get<std::string>();
}
```

## Variables d'environnement

- `CINETPAY_API_KEY`
- `CINETPAY_SITE_ID`
- `CINETPAY_SECRET_KEY`
- `APP_URL`
