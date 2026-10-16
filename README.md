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
Sans `DATABASE_URL`, l'application tourne en mémoire (rien n'est conservé au redémarrage).

## Ce qui est livré

| ID | Fonctionnalité | Où |
| --- | --- | --- |
| F1 | Recherche par service, pays, tag (insensible aux accents : « senegal » trouve SN) | `/contextes`, `GET /api/contexts?q=` |
| F2 | Fiche détaillée, copie en un clic | `/contextes/[slug]` |
| F3 | Inscription et connexion par email (mot de passe haché bcrypt), GitHub OAuth, session signée | `/connexion`, `/api/auth/*`, `src/lib/users.ts` |
| F4 | Soumission validée par la Spec, contrôle en direct | `/contribuer`, `POST /api/submit` |
| F5 | Votes, un par utilisateur et par contexte | `POST /api/contexts/[slug]/vote` |
| F6 | Scan de secrets, back-office de modération | `src/lib/spec.ts`, `/admin` |
| F7 | Endpoint brut et export par outil | `GET /api/contexts/[slug]/raw?tool=cursor\|claude-code\|agents` |
| F8 | CLI `npx africontext add <slug>` | `cli/` |
| F9 | Preuve avant / après, badge « testé avec » | `src/lib/proofs.ts` |
| F10 | Sandboxes Wave, Orange Money, FedaPay avec webhooks signés | `/sandbox`, `/api/sandbox/[service]/...` |
| F11 | Brouillon rédigé par Claude depuis l'URL d'une doc (outil web_fetch, limité au domaine de la doc), relu par l'auteur | `POST /api/draft`, `src/lib/draft-ai.ts` (squelette si `ANTHROPIC_API_KEY` absent) |
| F12 | Veille d'obsolescence par empreinte de la doc source | `src/lib/watch.ts`, service `veille` du compose |
| F16 | Compteurs d'impact, carte de couverture | `/impact` |

Les 12 contextes du catalogue sont des fichiers Markdown au format Spec dans `content/contexts/`.
Le responsable contenu doit les revérifier sur les documentations officielles avant la démo.

## Données

PostgreSQL via Prisma 7 : schéma dans `prisma/schema.prisma`, migrations dans `prisma/migrations/`.
Au démarrage (`src/instrumentation.ts`), les contextes de `content/` sont insérés en base, puis soumissions, statuts,
empreintes, votes, événements et signalements sont rechargés dans le cache mémoire (`src/lib/store.ts`).
Chaque écriture passe par `src/lib/persist.ts`, qui met à jour le cache puis la base.

```bash
DATABASE_URL=postgresql://... pnpm db:migrate   # applique les migrations
```

## CLI

```bash
AFRICONTEXT_URL=https://<url-systalink> node cli/bin/africontext.mjs add wave-checkout-api --tool cursor
AFRICONTEXT_URL=https://<url-systalink> node cli/bin/africontext.mjs search "orange money"
```

Publier `cli/` sur npm sous le nom `africontext` pour que `npx africontext` fonctionne.

## Déploiement Systalink

```bash
cp .env.example .env   # remplir AUTH_SECRET, CRON_SECRET, POSTGRES_PASSWORD, GitHub OAuth
docker compose up -d --build   # le service migrate applique les migrations avant de lancer web
```
