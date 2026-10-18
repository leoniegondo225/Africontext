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

```python
# pip install requests
import os
import requests

def create_flw_link(tx_ref: str, amount: float, email: str) -> str:
    res = requests.post(
        "https://api.flutterwave.com/v3/payments",
        headers={"Authorization": "Bearer " + os.environ["FLW_SECRET_KEY"]},
        json={
            "tx_ref": tx_ref,
            "amount": amount,
            "currency": "NGN",
            "redirect_url": os.environ["APP_URL"] + "/retour",
            "customer": {"email": email},
        },
        timeout=15,
    )
    res.raise_for_status()
    return res.json()["data"]["link"]
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function createFlwLink(string $txRef, float $amount, string $email): string
{
    $res = (new Client(["timeout" => 15]))->post("https://api.flutterwave.com/v3/payments", [
        "headers" => ["Authorization" => "Bearer " . getenv("FLW_SECRET_KEY")],
        "json" => [
            "tx_ref" => $txRef,
            "amount" => $amount,
            "currency" => "NGN",
            "redirect_url" => getenv("APP_URL") . "/retour",
            "customer" => ["email" => $email],
        ],
    ]);
    return json_decode((string) $res->getBody(), true)["data"]["link"];
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

std::string createFlwLink(const std::string& txRef, double amount, const std::string& email) {
    auto res = cpr::Post(
        cpr::Url{"https://api.flutterwave.com/v3/payments"},
        cpr::Header{{"Authorization", "Bearer " + env("FLW_SECRET_KEY")}, {"Content-Type", "application/json"}},
        cpr::Body{json{
            {"tx_ref", txRef},
            {"amount", amount},
            {"currency", "NGN"},
            {"redirect_url", env("APP_URL") + "/retour"},
            {"customer", {{"email", email}}},
        }.dump()},
        cpr::Timeout{15000});
    if (res.status_code < 200 || res.status_code >= 300)
        throw std::runtime_error("Flutterwave " + std::to_string(res.status_code) + ": " + res.text);
    return json::parse(res.text)["data"]["link"].get<std::string>();
}
```

## Variables d'environnement

- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_HASH`
- `APP_URL`
