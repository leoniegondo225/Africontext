---
slug: fedapay-transactions
title: FedaPay - Transactions et jeton de paiement
type: claude_prompt
service: FedaPay
pays: [BJ, CI, SN, TG, NE, BF, GN]
version_api: v1
source_url: https://docs.fedapay.com
tested_with: [claude-code, cursor]
last_verified_at: 2026-10-11
tags: [fintech, paiement-mobile, benin, webhook]
category: paiement
status: approved
author: Sèna Houngbo
github: senahoungbo
sandbox: fedapay
description: Crée une transaction FedaPay, génère son jeton de paiement et vérifie les webhooks transaction.approved.
---

## Authentification

- Header `Authorization: Bearer <FEDAPAY_SECRET_KEY>`.
- Deux environnements, deux clés : sandbox et live. Ne jamais mélanger.
- Base sandbox : `https://sandbox-api.fedapay.com/v1`. Base live : `https://api.fedapay.com/v1`.

## Endpoints

- `POST /transactions` crée une transaction.
  - Requis : `description`, `amount` (entier), `currency: { iso: "XOF" }`.
  - Optionnel : `callback_url`, `customer: { firstname, lastname, email, phone_number: { number, country } }`.
  - Réponse enveloppée sous la clé `"v1/transaction"` : `id`, `reference`, `status`.
- `POST /transactions/:id/token` génère le lien : `token`, `url`.
- `GET /transactions/:id` lit le statut : `pending`, `approved`, `declined`, `canceled`.

## Erreurs

- `401` clé invalide ou mauvais environnement.
- `422` validation : le corps contient `message` et `errors` par champ.
- `404` transaction inconnue dans cet environnement.
- `5xx` réessayer avec backoff.

## Webhooks

- Header `X-FEDAPAY-SIGNATURE`.
- Vérifier avec le secret du webhook (`FEDAPAY_WEBHOOK_SECRET`) sur le corps brut, ou via `Webhook.constructEvent` du SDK officiel.
- Événements : `transaction.approved`, `transaction.declined`, `transaction.canceled`.

## Idempotence et limites

- Une transaction ne se paie qu'une fois. Pour réessayer, créer une nouvelle transaction.
- Stocker `id` et `reference` côté serveur avant de rediriger.

## Pièges courants

- `currency` est un objet `{ iso: "XOF" }`, pas la chaîne `"XOF"`.
- La réponse de création est sous `data["v1/transaction"]`, pas à la racine.
- Il n'y a pas d'endpoint `/payments` ni `/checkout` : c'est `/transactions` puis `/transactions/:id/token`.
- `amount` est un entier en XOF, sans multiplication par 100.

## Exemple minimal

```ts
const BASE = process.env.FEDAPAY_ENV === "live" ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";

type FedaTransaction = { id: number; reference: string; status: string };

export async function createFedaPayLink(amount: number, description: string): Promise<string> {
  const headers = { Authorization: "Bearer " + process.env.FEDAPAY_SECRET_KEY, "Content-Type": "application/json" };
  const created = await fetch(BASE + "/transactions", {
    method: "POST",
    headers,
    body: JSON.stringify({ description, amount, currency: { iso: "XOF" }, callback_url: process.env.APP_URL + "/paiement/retour" }),
  });
  const tx = ((await created.json()) as Record<string, FedaTransaction>)["v1/transaction"];
  const tokenRes = await fetch(BASE + "/transactions/" + tx.id + "/token", { method: "POST", headers });
  const { url } = (await tokenRes.json()) as { token: string; url: string };
  return url;
}
```

```python
# pip install requests
import os
import requests

BASE = "https://api.fedapay.com/v1" if os.environ.get("FEDAPAY_ENV") == "live" else "https://sandbox-api.fedapay.com/v1"

def create_fedapay_link(amount: int, description: str) -> str:
    headers = {"Authorization": "Bearer " + os.environ["FEDAPAY_SECRET_KEY"]}
    created = requests.post(
        BASE + "/transactions",
        headers=headers,
        json={
            "description": description,
            "amount": amount,
            "currency": {"iso": "XOF"},
            "callback_url": os.environ["APP_URL"] + "/paiement/retour",
        },
        timeout=15,
    )
    created.raise_for_status()
    tx = created.json()["v1/transaction"]
    token_res = requests.post(f"{BASE}/transactions/{tx['id']}/token", headers=headers, timeout=15)
    token_res.raise_for_status()
    return token_res.json()["url"]
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function createFedaPayLink(int $amount, string $description): string
{
    $base = getenv("FEDAPAY_ENV") === "live" ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";
    $http = new Client(["timeout" => 15]);
    $headers = ["Authorization" => "Bearer " . getenv("FEDAPAY_SECRET_KEY")];
    $created = $http->post($base . "/transactions", [
        "headers" => $headers,
        "json" => [
            "description" => $description,
            "amount" => $amount,
            "currency" => ["iso" => "XOF"],
            "callback_url" => getenv("APP_URL") . "/paiement/retour",
        ],
    ]);
    $tx = json_decode((string) $created->getBody(), true)["v1/transaction"];
    $tokenRes = $http->post($base . "/transactions/" . $tx["id"] . "/token", ["headers" => $headers]);
    return json_decode((string) $tokenRes->getBody(), true)["url"];
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

std::string createFedaPayLink(long amount, const std::string& description) {
    const char* mode = std::getenv("FEDAPAY_ENV");
    const std::string base = (mode && std::string(mode) == "live") ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";
    const cpr::Header headers{{"Authorization", "Bearer " + env("FEDAPAY_SECRET_KEY")}, {"Content-Type", "application/json"}};
    auto res = cpr::Post(
        cpr::Url{base + "/transactions"},
        headers,
        cpr::Body{json{
            {"description", description},
            {"amount", amount},
            {"currency", {{"iso", "XOF"}}},
            {"callback_url", env("APP_URL") + "/paiement/retour"},
        }.dump()},
        cpr::Timeout{15000});
    if (res.status_code < 200 || res.status_code >= 300)
        throw std::runtime_error("FedaPay " + std::to_string(res.status_code) + ": " + res.text);
    const auto tx = json::parse(res.text)["v1/transaction"];
    auto tokenRes = cpr::Post(cpr::Url{base + "/transactions/" + std::to_string(tx["id"].get<long>()) + "/token"}, headers, cpr::Timeout{15000});
    if (tokenRes.status_code != 200) throw std::runtime_error("FedaPay token " + std::to_string(tokenRes.status_code));
    return json::parse(tokenRes.text)["url"].get<std::string>();
}
```

## Variables d'environnement

- `FEDAPAY_SECRET_KEY`
- `FEDAPAY_WEBHOOK_SECRET`
- `FEDAPAY_ENV`
- `APP_URL`
