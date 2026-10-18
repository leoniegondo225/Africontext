/**
 * Construit un brouillon au format de la Spec à partir d'une URL de documentation.
 *
 * Produit un squelette structuré à partir de ce que l'URL indique (service, pays,
 * tags). C'est ici que l'appel à l'IA se branche. Dans tous les cas, l'auteur doit
 * remplir et relire chaque section avant de publier.
 */
const KNOWN: Record<string, { service: string; pays: string[]; tags: string[] }> = {
  "wave.com": { service: "Wave", pays: ["SN", "CI"], tags: ["fintech", "paiement-mobile"] },
  "orange.com": { service: "Orange", pays: ["SN", "CI", "ML", "CM"], tags: ["orange"] },
  "fedapay.com": { service: "FedaPay", pays: ["BJ", "CI", "TG"], tags: ["fintech", "paiement-mobile"] },
  "momodeveloper.mtn.com": { service: "MTN MoMo", pays: ["CI", "CM", "GH"], tags: ["fintech", "paiement-mobile"] },
  "paystack.com": { service: "Paystack", pays: ["NG", "GH"], tags: ["fintech", "carte"] },
  "flutterwave.com": { service: "Flutterwave", pays: ["NG", "KE"], tags: ["fintech"] },
  "safaricom.co.ke": { service: "M-Pesa", pays: ["KE"], tags: ["fintech", "paiement-mobile"] },
  "africastalking.com": { service: "Africa's Talking", pays: ["KE", "NG"], tags: ["sms"] },
  "cinetpay.com": { service: "CinetPay", pays: ["CI", "SN"], tags: ["fintech", "paiement-mobile"] },
  "paydunya.com": { service: "PayDunya", pays: ["SN", "CI"], tags: ["fintech"] },
  "kkiapay.me": { service: "Kkiapay", pays: ["BJ", "CI"], tags: ["fintech", "paiement-mobile"] },
  "hub2.io": { service: "HUB2", pays: ["CI", "SN"], tags: ["fintech", "agregateur"] },
};

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function draftFromUrl(raw: string): string {
  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, "");
  const known = Object.entries(KNOWN).find(([domain]) => host === domain || host.endsWith("." + domain))?.[1];
  const service = known?.service ?? host.split(".").slice(-2, -1)[0]?.replace(/^\w/, (c) => c.toUpperCase()) ?? "Service";
  const topic = url.pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") ?? "api";
  const slug = slugify(service + " " + topic).slice(0, 48);
  const today = new Date().toISOString().slice(0, 10);

  return `---
slug: ${slug}
title: ${service} - ${topic.replace(/^\w/, (c) => c.toUpperCase())}
type: cursorrules
service: ${service}
pays: [${(known?.pays ?? ["SN"]).join(", ")}]
version_api: v1
source_url: ${url.toString()}
tested_with: [cursor, claude-code]
last_verified_at: ${today}
tags: [${(known?.tags ?? ["api"]).join(", ")}]
---

## Authentification

- À compléter : méthode (Bearer, Basic, OAuth client_credentials) et nom exact des headers.
- Ne jamais écrire de valeur secrète : seulement le nom de la variable d'environnement.

## Endpoints

- À compléter : méthode, URL complète, champs requis et optionnels, forme de la réponse.

## Erreurs

- À compléter : codes HTTP et codes métier, et quoi faire pour chacun.

## Webhooks

- À compléter : événements, header de signature, algorithme de vérification.

## Idempotence et limites

- À compléter : clé d'idempotence, limites de débit.

## Pièges courants

- À compléter : demandez à l'IA d'intégrer ${service} sans contexte et notez ce qu'elle invente.

## Exemple minimal

\`\`\`ts
// Exemple typé et complet, testé contre la doc source.
\`\`\`

\`\`\`python
# Le même exemple en Python (requests).
\`\`\`

\`\`\`php
<?php
// Le même exemple en PHP (Guzzle).
\`\`\`

\`\`\`cpp
// Le même exemple en C++ (cpr et nlohmann/json).
\`\`\`

## Variables d'environnement

- \`${slugify(service).toUpperCase().replace(/-/g, "_")}_API_KEY\`
`;
}
