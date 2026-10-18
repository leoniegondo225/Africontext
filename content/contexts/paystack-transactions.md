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

```python
# pip install requests
import os
import uuid
import requests

def init_paystack(email: str, amount_major: float) -> dict:
    res = requests.post(
        "https://api.paystack.co/transaction/initialize",
        headers={"Authorization": "Bearer " + os.environ["PAYSTACK_SECRET_KEY"]},
        json={"email": email, "amount": round(amount_major * 100), "reference": str(uuid.uuid4())},
        timeout=15,
    )
    body = res.json()
    if not body.get("status"):
        raise RuntimeError("Paystack init failed")
    return body["data"]  # authorization_url, reference
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function initPaystack(string $email, float $amountMajor): array
{
    $res = (new Client(["timeout" => 15]))->post("https://api.paystack.co/transaction/initialize", [
        "headers" => ["Authorization" => "Bearer " . getenv("PAYSTACK_SECRET_KEY")],
        "json" => ["email" => $email, "amount" => (int) round($amountMajor * 100), "reference" => bin2hex(random_bytes(16))],
    ]);
    $body = json_decode((string) $res->getBody(), true);
    if (empty($body["status"])) {
        throw new RuntimeException("Paystack init failed");
    }
    return $body["data"]; // authorization_url, reference
}
```

```cpp
// vcpkg install cpr nlohmann-json
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <cstdlib>
#include <stdexcept>
#include <string>
#include <cmath>
#include <random>

using json = nlohmann::json;

static std::string env(const char* name) {
    const char* v = std::getenv(name);
    if (!v) throw std::runtime_error(std::string("Variable d'environnement manquante : ") + name);
    return v;
}

static std::string uuid4() {
    static std::mt19937_64 gen{std::random_device{}()};
    std::uniform_int_distribution<int> hex(0, 15);
    const char* digits = "0123456789abcdef";
    std::string s = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    for (char& c : s) {
        if (c == 'x') c = digits[hex(gen)];
        else if (c == 'y') c = digits[8 + hex(gen) % 4];
    }
    return s;
}

json initPaystack(const std::string& email, double amountMajor) {
    auto res = cpr::Post(
        cpr::Url{"https://api.paystack.co/transaction/initialize"},
        cpr::Header{{"Authorization", "Bearer " + env("PAYSTACK_SECRET_KEY")}, {"Content-Type", "application/json"}},
        cpr::Body{json{{"email", email}, {"amount", std::llround(amountMajor * 100)}, {"reference", uuid4()}}.dump()},
        cpr::Timeout{15000});
    const auto body = json::parse(res.text);
    if (!body.value("status", false)) throw std::runtime_error("Paystack init failed");
    return body["data"];  // authorization_url, reference
}
```

## Variables d'environnement

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
