---
slug: paydunya-checkout
title: PayDunya - Facture de paiement
type: cursorrules
service: PayDunya
pays: [SN, CI, BJ, TG, BF, ML]
version_api: v1
source_url: https://developers.paydunya.com/doc/FR/http_json
tested_with: [cursor]
last_verified_at: 2026-10-13
tags: [fintech, paiement-mobile, senegal, facture]
category: paiement
status: pending
author: Ibrahima Sow
github: isow
description: Crée une facture PayDunya avec les trois clés en header et redirige vers l'URL renvoyée dans response_text.
---

## Authentification

- Trois headers : `PAYDUNYA-MASTER-KEY`, `PAYDUNYA-PRIVATE-KEY`, `PAYDUNYA-TOKEN`.
- Les clés test et live sont différentes.

## Endpoints

- Test : `POST https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create`
- Live : `POST https://app.paydunya.com/api/v1/checkout-invoice/create`
- Corps : `invoice: { total_amount, description }`, `store: { name }`, `actions: { callback_url, return_url, cancel_url }`.
- Réponse : `response_code: "00"`, `response_text` (URL de paiement), `token`.
- `GET .../checkout-invoice/confirm/:token` lit le statut.

## Erreurs

- `response_code` différent de `"00"` : lire `response_text`.

## Webhooks

- PayDunya appelle `callback_url` en `POST` avec `data.hash` : SHA-512 de votre master key, à comparer.

## Idempotence et limites

- Un `token` par facture. Confirmer avec `/confirm/:token` avant de livrer.

## Pièges courants

- L'URL de paiement est dans `response_text`, pas dans un champ `url`.
- Le chemin de test contient `sandbox-api`, pas un sous-domaine `sandbox.`.

## Exemple minimal

```ts
export async function createInvoice(total: number, description: string): Promise<string> {
  const res = await fetch("https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY ?? "",
      "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY ?? "",
      "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN ?? "",
    },
    body: JSON.stringify({ invoice: { total_amount: total, description }, store: { name: "Ma boutique" } }),
  });
  const json = (await res.json()) as { response_code: string; response_text: string };
  if (json.response_code !== "00") throw new Error(json.response_text);
  return json.response_text;
}
```

```python
# pip install requests
import os
import requests

def create_invoice(total: int, description: str) -> str:
    res = requests.post(
        "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
        headers={
            "PAYDUNYA-MASTER-KEY": os.environ["PAYDUNYA_MASTER_KEY"],
            "PAYDUNYA-PRIVATE-KEY": os.environ["PAYDUNYA_PRIVATE_KEY"],
            "PAYDUNYA-TOKEN": os.environ["PAYDUNYA_TOKEN"],
        },
        json={"invoice": {"total_amount": total, "description": description}, "store": {"name": "Ma boutique"}},
        timeout=15,
    )
    body = res.json()
    if body.get("response_code") != "00":
        raise RuntimeError(body.get("response_text"))
    return body["response_text"]
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function createInvoice(int $total, string $description): string
{
    $res = (new Client(["timeout" => 15, "http_errors" => false]))->post("https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create", [
        "headers" => [
            "PAYDUNYA-MASTER-KEY" => getenv("PAYDUNYA_MASTER_KEY"),
            "PAYDUNYA-PRIVATE-KEY" => getenv("PAYDUNYA_PRIVATE_KEY"),
            "PAYDUNYA-TOKEN" => getenv("PAYDUNYA_TOKEN"),
        ],
        "json" => ["invoice" => ["total_amount" => $total, "description" => $description], "store" => ["name" => "Ma boutique"]],
    ]);
    $body = json_decode((string) $res->getBody(), true);
    if (($body["response_code"] ?? null) !== "00") {
        throw new RuntimeException($body["response_text"] ?? "PayDunya " . $res->getStatusCode());
    }
    return $body["response_text"];
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

std::string createInvoice(long total, const std::string& description) {
    auto res = cpr::Post(
        cpr::Url{"https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create"},
        cpr::Header{
            {"Content-Type", "application/json"},
            {"PAYDUNYA-MASTER-KEY", env("PAYDUNYA_MASTER_KEY")},
            {"PAYDUNYA-PRIVATE-KEY", env("PAYDUNYA_PRIVATE_KEY")},
            {"PAYDUNYA-TOKEN", env("PAYDUNYA_TOKEN")},
        },
        cpr::Body{json{{"invoice", {{"total_amount", total}, {"description", description}}}, {"store", {{"name", "Ma boutique"}}}}.dump()},
        cpr::Timeout{15000});
    const auto body = json::parse(res.text);
    if (body.value("response_code", "") != "00") throw std::runtime_error(body.value("response_text", "PayDunya"));
    return body["response_text"].get<std::string>();
}
```

## Variables d'environnement

- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`
