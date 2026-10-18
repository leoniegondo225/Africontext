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

```python
# pip install requests
import os
import uuid
import requests

def request_to_pay(token: str, msisdn: str, amount: int) -> str:
    reference_id = str(uuid.uuid4())
    res = requests.post(
        "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
        headers={
            "Authorization": "Bearer " + token,
            "X-Reference-Id": reference_id,
            "X-Target-Environment": os.environ.get("MOMO_TARGET_ENV", "sandbox"),
            "Ocp-Apim-Subscription-Key": os.environ["MOMO_SUBSCRIPTION_KEY"],
        },
        json={
            "amount": str(amount),
            "currency": "EUR",
            "externalId": reference_id,
            "payer": {"partyIdType": "MSISDN", "partyId": msisdn},
            "payerMessage": "Commande",
            "payeeNote": "Commande",
        },
        timeout=15,
    )
    if res.status_code != 202:
        raise RuntimeError(f"MoMo {res.status_code}")
    return reference_id
```

```php
<?php
// composer require guzzlehttp/guzzle ramsey/uuid
use GuzzleHttp\Client;
use Ramsey\Uuid\Uuid;

function requestToPay(string $token, string $msisdn, int $amount): string
{
    $referenceId = Uuid::uuid4()->toString();
    $res = (new Client(["timeout" => 15]))->post("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", [
        "headers" => [
            "Authorization" => "Bearer " . $token,
            "X-Reference-Id" => $referenceId,
            "X-Target-Environment" => getenv("MOMO_TARGET_ENV") ?: "sandbox",
            "Ocp-Apim-Subscription-Key" => getenv("MOMO_SUBSCRIPTION_KEY"),
        ],
        "json" => [
            "amount" => (string) $amount,
            "currency" => "EUR",
            "externalId" => $referenceId,
            "payer" => ["partyIdType" => "MSISDN", "partyId" => $msisdn],
            "payerMessage" => "Commande",
            "payeeNote" => "Commande",
        ],
    ]);
    if ($res->getStatusCode() !== 202) {
        throw new RuntimeException("MoMo " . $res->getStatusCode());
    }
    return $referenceId;
}
```

```cpp
// vcpkg install cpr nlohmann-json
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <cstdlib>
#include <stdexcept>
#include <string>
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

std::string requestToPay(const std::string& token, const std::string& msisdn, long amount) {
    const std::string referenceId = uuid4();
    const char* target = std::getenv("MOMO_TARGET_ENV");
    auto res = cpr::Post(
        cpr::Url{"https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay"},
        cpr::Header{
            {"Authorization", "Bearer " + token},
            {"X-Reference-Id", referenceId},
            {"X-Target-Environment", target ? target : "sandbox"},
            {"Ocp-Apim-Subscription-Key", env("MOMO_SUBSCRIPTION_KEY")},
            {"Content-Type", "application/json"},
        },
        cpr::Body{json{
            {"amount", std::to_string(amount)},
            {"currency", "EUR"},
            {"externalId", referenceId},
            {"payer", {{"partyIdType", "MSISDN"}, {"partyId", msisdn}}},
            {"payerMessage", "Commande"},
            {"payeeNote", "Commande"},
        }.dump()},
        cpr::Timeout{15000});
    if (res.status_code != 202) throw std::runtime_error("MoMo " + std::to_string(res.status_code));
    return referenceId;
}
```

## Variables d'environnement

- `MOMO_API_USER`
- `MOMO_API_KEY`
- `MOMO_SUBSCRIPTION_KEY`
- `MOMO_TARGET_ENV`
