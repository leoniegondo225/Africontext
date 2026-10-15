# AfriContext

Plateforme d'échange de contextes IA pour intégrer les services africains du premier coup.
CADEV 2026, Systalink Challenge, équipe Impaact code.

## Démarrer

```bash
pnpm install
cp .env.example .env   # facultatif en local
pnpm dev               # http://localhost:3000
```

Sans GitHub OAuth configuré, la page `/connexion` propose une connexion démo « Contributeur » ou « Administrateur ».

## Ce qui est livré

| ID | Fonctionnalité | Où |
| --- | --- | --- |
| F1 | Recherche par service, pays, tag (insensible aux accents : « senegal » trouve SN) | `/contextes`, `GET /api/contexts?q=` |
| F2 | Fiche détaillée, copie en un clic | `/contextes/[slug]` |
| F3 | Connexion GitHub OAuth, session signée | `/connexion`, `/api/auth/*` |
| F4 | Soumission validée par la Spec, contrôle en direct | `/contribuer`, `POST /api/submit` |
| F5 | Votes, un par utilisateur et par contexte | `POST /api/contexts/[slug]/vote` |
| F6 | Scan de secrets, back-office de modération | `src/lib/spec.ts`, `/admin` |
| F7 | Endpoint brut et export par outil | `GET /api/contexts/[slug]/raw?tool=cursor\|claude-code\|agents` |
| F8 | CLI `npx africontext add <slug>` | `cli/` |
| F9 | Preuve avant / après, badge « testé avec » | `src/lib/proofs.ts` |
| F10 | Sandboxes Wave, Orange Money, FedaPay avec webhooks signés | `/sandbox`, `/api/sandbox/[service]/...` |
| F11 | Brouillon depuis l'URL d'une doc | `POST /api/draft` (squelette ; l'appel IA se branche dans `src/lib/draft.ts`) |
| F12 | Veille d'obsolescence par empreinte de la doc source | `src/lib/watch.ts`, service `veille` du compose |
| F16 | Compteurs d'impact, carte de couverture | `/impact` |

Les 12 contextes du catalogue sont des fichiers Markdown au format Spec dans `content/contexts/`.
Le responsable contenu doit les revérifier sur les documentations officielles avant la démo.

## Données

Le MVP tourne sur un store en mémoire (`src/lib/store.ts`) qui reproduit les tables du cahier des charges.
Le schéma cible PostgreSQL est dans `prisma/schema.prisma`. Votes, soumissions et compteurs sont perdus au redémarrage tant que ce store n'est pas branché sur Prisma.

## CLI

```bash
AFRICONTEXT_URL=https://<url-systalink> node cli/bin/africontext.mjs add wave-checkout-api --tool cursor
AFRICONTEXT_URL=https://<url-systalink> node cli/bin/africontext.mjs search "orange money"
```

Publier `cli/` sur npm sous le nom `africontext` pour que `npx africontext` fonctionne.

## Déploiement Systalink

```bash
cp .env.example .env   # remplir AUTH_SECRET, CRON_SECRET, POSTGRES_PASSWORD, GitHub OAuth
docker compose up -d --build
```
