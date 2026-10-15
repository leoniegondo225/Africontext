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

## Variables d'environnement

- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`
