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

```python
# pip install requests
import os
import requests

def send_sms(to: list[str], message: str) -> dict:
    res = requests.post(
        "https://api.sandbox.africastalking.com/version1/messaging",
        headers={"apiKey": os.environ["AT_API_KEY"], "Accept": "application/json"},
        data={"username": os.environ.get("AT_USERNAME", "sandbox"), "to": ",".join(to), "message": message},
        timeout=15,
    )
    return res.json()
```

```php
<?php
// composer require guzzlehttp/guzzle
use GuzzleHttp\Client;

function sendSms(array $to, string $message): array
{
    $res = (new Client(["timeout" => 15]))->post("https://api.sandbox.africastalking.com/version1/messaging", [
        "headers" => ["apiKey" => getenv("AT_API_KEY"), "Accept" => "application/json"],
        "form_params" => ["username" => getenv("AT_USERNAME") ?: "sandbox", "to" => implode(",", $to), "message" => $message],
    ]);
    return json_decode((string) $res->getBody(), true);
}
```

```cpp
// vcpkg install cpr nlohmann-json
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <cstdlib>
#include <stdexcept>
#include <string>
#include <vector>

using json = nlohmann::json;

static std::string env(const char* name) {
    const char* v = std::getenv(name);
    if (!v) throw std::runtime_error(std::string("Variable d'environnement manquante : ") + name);
    return v;
}

json sendSms(const std::vector<std::string>& to, const std::string& message) {
    std::string recipients;
    for (const auto& n : to) recipients += (recipients.empty() ? "" : ",") + n;
    const char* user = std::getenv("AT_USERNAME");
    auto res = cpr::Post(
        cpr::Url{"https://api.sandbox.africastalking.com/version1/messaging"},
        cpr::Header{{"apiKey", env("AT_API_KEY")}, {"Accept", "application/json"}},
        cpr::Payload{{"username", user ? user : "sandbox"}, {"to", recipients}, {"message", message}},
        cpr::Timeout{15000});
    return json::parse(res.text);
}
```

## Variables d'environnement

- `AT_USERNAME`
- `AT_API_KEY`
