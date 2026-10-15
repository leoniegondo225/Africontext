---
slug: africontext-mcp-server
title: Serveur MCP AfriContext
type: mcp_server
service: AfriContext
pays: [SN, CI, BJ, CM, KE, NG, GH]
version_api: v0
source_url: https://modelcontextprotocol.io/specification
tested_with: [claude-code, cursor]
last_verified_at: 2026-10-13
tags: [mcp, outillage, recherche]
category: outillage
status: approved
author: Équipe Impaact code
github: impaact-code
description: Expose search_context et get_context à Claude Code ou Cursor, pour que l'agent trouve lui-même le bon contexte.
---

## Authentification

- Lecture publique : aucune clé requise pour les contextes approuvés.
- L'URL du serveur est affichée, jamais exécutée par la plateforme. Vérifiez-la avant de l'installer.

## Endpoints

- Outil `search_context(query: string, pays?: string)` : renvoie slug, titre, service et date de vérification.
- Outil `get_context(slug: string, tool: "cursor" | "claude-code" | "agents")` : renvoie le contenu exporté.
- Endpoint brut sous-jacent : `GET /api/contexts/:slug/raw?tool=cursor`.

## Erreurs

- Slug inconnu : erreur `not_found` avec suggestions.
- Contexte en `to_recheck` : renvoyé avec un avertissement en tête.

## Webhooks

- Aucun webhook : le serveur est en lecture seule.

## Idempotence et limites

- 60 requêtes par minute et par IP.

## Pièges courants

- Ne pas confondre le serveur MCP avec un contexte : il sert à chercher, pas à remplacer la lecture de la fiche.

## Exemple minimal

```json
{
  "mcpServers": {
    "africontext": { "command": "npx", "args": ["-y", "africontext", "mcp"] }
  }
}
```

## Variables d'environnement

- `AFRICONTEXT_URL`
