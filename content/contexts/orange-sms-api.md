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

```python
# pip install requests
import os
from urllib.parse import quote
import requests

def send_orange_sms(token: str, to: str, message: str) -> None:
    sender = "tel:+" + os.environ["ORANGE_SMS_SENDER"]
    url = "https://api.orange.com/smsmessaging/v1/outbound/" + quote(sender, safe="") + "/requests"
    res = requests.post(
        url,
        headers={"Authorization": "Bearer " + token},
        json={
            "outboundSMSMessageRequest": {
                "address": "tel:" + to,
                "senderAddress": sender,
                "outboundSMSTextMessage": {"message": message},
            }
        },
        timeout=15,
    )
    if res.status_code != 201:
        raise RuntimeError(f"Orange SMS {res.status_code}")
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function sendOrangeSms(string $token, string $to, string $message): void
{
    $sender = "tel:+" . getenv("ORANGE_SMS_SENDER");
    $url = "https://api.orange.com/smsmessaging/v1/outbound/" . rawurlencode($sender) . "/requests";
    $res = (new Client(["timeout" => 15]))->post($url, [
        "headers" => ["Authorization" => "Bearer " . $token],
        "json" => [
            "outboundSMSMessageRequest" => [
                "address" => "tel:" . $to,
                "senderAddress" => $sender,
                "outboundSMSTextMessage" => ["message" => $message],
            ],
        ],
    ]);
    if ($res->getStatusCode() !== 201) {
        throw new RuntimeException("Orange SMS " . $res->getStatusCode());
    }
}
```

```cpp
// vcpkg install cpr nlohmann-json
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <cstdlib>
#include <stdexcept>
#include <string>
#include <cctype>
#include <cstdio>

using json = nlohmann::json;

static std::string env(const char* name) {
    const char* v = std::getenv(name);
    if (!v) throw std::runtime_error(std::string("Variable d'environnement manquante : ") + name);
    return v;
}

static std::string urlEncode(const std::string& s) {
    std::string out;
    char buf[4];
    for (unsigned char c : s) {
        if (std::isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') out += static_cast<char>(c);
        else {
            std::snprintf(buf, sizeof buf, "%%%02X", c);
            out += buf;
        }
    }
    return out;
}

void sendOrangeSms(const std::string& token, const std::string& to, const std::string& message) {
    const std::string sender = "tel:+" + env("ORANGE_SMS_SENDER");
    auto res = cpr::Post(
        cpr::Url{"https://api.orange.com/smsmessaging/v1/outbound/" + urlEncode(sender) + "/requests"},
        cpr::Header{{"Authorization", "Bearer " + token}, {"Content-Type", "application/json"}},
        cpr::Body{json{{"outboundSMSMessageRequest", {
            {"address", "tel:" + to},
            {"senderAddress", sender},
            {"outboundSMSTextMessage", {{"message", message}}},
        }}}.dump()},
        cpr::Timeout{15000});
    if (res.status_code != 201) throw std::runtime_error("Orange SMS " + std::to_string(res.status_code));
}
```

## Variables d'environnement

- `ORANGE_CLIENT_ID`
- `ORANGE_CLIENT_SECRET`
- `ORANGE_SMS_SENDER`
