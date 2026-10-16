import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { toContext } from "./catalog";
import { db, persist } from "./db";
import { PROOFS } from "./proofs";
import { recordEvent, statsFor, store, vote, type EventRow } from "./store";
import type { AfriContext, ContextStats, ContextStatus } from "./types";

/**
 * Toutes les écritures passent par ici : le cache mémoire (src/lib/store.ts) est mis à jour
 * tout de suite, puis PostgreSQL via Prisma quand DATABASE_URL est défini.
 */

const SYSTEM_AUTHOR = "impaact-code";
const CONTENT_DIR = path.join(process.cwd(), "content", "contexts");

function date(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Colonnes de la table Contexts tirées d'un contexte au format Spec. */
function contextColumns(ctx: AfriContext, raw: string) {
  return {
    title: ctx.title,
    description: ctx.description,
    type: ctx.type,
    content_payload: raw,
    service: ctx.service,
    pays: ctx.pays,
    version_api: ctx.version_api,
    source_url: ctx.source_url,
    tested_with: ctx.tested_with,
    last_verified_at: date(ctx.last_verified_at),
  };
}

async function ensureUser(p: PrismaClient, id: string, nom?: string) {
  await p.user.upsert({
    where: { id },
    create: { id, nom: nom ?? (id.startsWith("anon-") ? "Visiteur anonyme" : id) },
    update: {},
  });
}

async function syncTags(p: PrismaClient, contextId: string, tags: string[]) {
  for (const name of tags) {
    const tag = await p.tag.upsert({ where: { name }, create: { name }, update: {} });
    await p.contextTag.upsert({
      where: { context_id_tag_id: { context_id: contextId, tag_id: tag.id } },
      create: { context_id: contextId, tag_id: tag.id },
      update: {},
    });
  }
}

/* ---------- Écritures ---------- */

export function logEvent(slug: string, kind: EventRow["kind"]): ContextStats {
  const stats = recordEvent(slug, kind);
  void persist("événement", (p) => p.event.create({ data: { context_id: slug, kind } }));
  return stats;
}

export function castVote(slug: string, voter: string, value: 1 | -1) {
  const result = vote(slug, voter, value);
  void persist("vote", async (p) => {
    await ensureUser(p, voter);
    if (result.mine === 0) await p.vote.deleteMany({ where: { user_id: voter, context_id: slug } });
    else
      await p.vote.upsert({
        where: { user_id_context_id: { user_id: voter, context_id: slug } },
        create: { user_id: voter, context_id: slug, value: result.mine },
        update: { value: result.mine },
      });
  });
  return result;
}

/** Enregistre une soumission « en attente ». On attend la base pour ne confirmer qu'une soumission réellement stockée. */
export async function submitContext(raw: string, author: string, authorName: string): Promise<string> {
  const ctx = toContext(raw, "pending");
  store().submissions.unshift({ id: randomUUID(), slug: ctx.slug, raw, author, createdAt: new Date().toISOString() });
  store().status.set(ctx.slug, "pending");
  await persist("soumission", async (p) => {
    await ensureUser(p, author, authorName);
    await p.context.create({ data: { id: ctx.slug, slug: ctx.slug, ...contextColumns(ctx, raw), status: "pending", author_id: author } });
    await p.contextVersion.create({ data: { context_id: ctx.slug, content_payload: raw, note: "Soumission initiale" } });
    await syncTags(p, ctx.slug, ctx.tags);
  });
  return ctx.slug;
}

export function setContextStatus(slug: string, status: ContextStatus) {
  const s = store();
  s.status.set(slug, status);
  // Ré-approuver efface l'empreinte : la prochaine veille repart d'une nouvelle référence.
  if (status === "approved") s.sourceHashes.delete(slug);
  void persist("statut", (p) =>
    p.context.update({
      where: { id: slug },
      data: status === "approved" ? { status, source_hash: null, source_checked_at: null } : { status },
    }),
  );
}

export function setSourceHash(slug: string, hash: string) {
  const checkedAt = Date.now();
  store().sourceHashes.set(slug, { hash, checkedAt });
  void persist("empreinte", (p) =>
    p.context.update({ where: { id: slug }, data: { source_hash: hash, source_checked_at: new Date(checkedAt) } }),
  );
}

export function addReport(slug: string, reason: string, userId?: string) {
  store().reports.unshift({ slug, reason, at: Date.now() });
  void persist("signalement", async (p) => {
    if (userId) await ensureUser(p, userId);
    await p.report.create({ data: { context_id: slug, raison: reason, user_id: userId ?? null } });
  });
}

/** Utilisateurs connectés avec GitHub : la table Users garde le lien vers le compte. */
export function saveGithubUser(login: string, name: string, githubId: string, role: "user" | "admin") {
  void persist("utilisateur GitHub", (p) =>
    p.user.upsert({
      where: { id: login },
      create: { id: login, nom: name, github_id: githubId, github_url: `https://github.com/${login}`, role },
      update: { nom: name, github_id: githubId, github_url: `https://github.com/${login}`, role },
    }),
  );
}

/* ---------- Chargement au démarrage ---------- */

/**
 * Appelé une fois par src/instrumentation.ts avant la première requête.
 * 1. Insère ou met à jour les contextes du dossier content/ (sans toucher à leur statut).
 * 2. Recharge en mémoire soumissions, statuts, empreintes, votes, événements et signalements.
 */
export async function hydrateFromDatabase() {
  const p = db();
  if (!p) {
    console.info("[db] DATABASE_URL absent : données en mémoire seulement, perdues au redémarrage.");
    return;
  }

  await ensureUser(p, SYSTEM_AUTHOR, "Équipe Impaact code");
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
    const ctx = toContext(raw, "approved");
    const columns = contextColumns(ctx, raw);
    await p.context.upsert({
      where: { id: ctx.slug },
      create: { id: ctx.slug, slug: ctx.slug, ...columns, status: ctx.status, author_id: SYSTEM_AUTHOR },
      update: columns,
    });
    await syncTags(p, ctx.slug, ctx.tags);
    const proof = PROOFS[ctx.slug];
    if (proof && !(await p.proof.findFirst({ where: { context_id: ctx.slug } }))) {
      await p.proof.create({
        data: { context_id: ctx.slug, prompt: proof.prompt, output_sans_contexte: proof.without, output_avec_contexte: proof.withContext, modele: proof.model },
      });
    }
  }

  const s = store();
  const fileSlugs = new Set(files.map((f) => toContext(fs.readFileSync(path.join(CONTENT_DIR, f), "utf8")).slug));
  const contexts = await p.context.findMany({ orderBy: { created_at: "desc" } });
  s.submissions = contexts
    .filter((c) => !fileSlugs.has(c.slug))
    .map((c) => ({ id: c.id, slug: c.slug, raw: c.content_payload, author: c.author_id, createdAt: c.created_at.toISOString() }));
  for (const c of contexts) {
    s.status.set(c.slug, c.status);
    if (c.source_hash) s.sourceHashes.set(c.slug, { hash: c.source_hash, checkedAt: c.source_checked_at?.getTime() ?? Date.now() });
  }

  // Les compteurs repartent des valeurs de départ, plus tout ce que la base a enregistré.
  for (const v of await p.vote.findMany()) {
    s.votes.set(v.user_id + ":" + v.context_id, v.value === 1 ? 1 : -1);
    const st = statsFor(v.context_id);
    if (v.value === 1) st.up++;
    else st.down++;
  }
  const events = await p.event.groupBy({ by: ["context_id", "kind"], _count: { _all: true } });
  for (const e of events) {
    const st = statsFor(e.context_id);
    if (e.kind === "copy") st.copies += e._count._all;
    else st.installs += e._count._all;
  }

  const reports = await p.report.findMany({ where: { status: "open" }, orderBy: { created_at: "desc" } });
  if (reports.length) s.reports = reports.map((r) => ({ slug: r.context_id, reason: r.raison, at: r.created_at.getTime() }));

  console.info(`[db] ${contexts.length} contextes, ${s.votes.size} votes et ${reports.length} signalements rechargés depuis PostgreSQL.`);
}
