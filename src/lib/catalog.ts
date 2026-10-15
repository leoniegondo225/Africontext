import fs from "node:fs";
import path from "node:path";
import { PROOFS } from "./proofs";
import { filterContexts, type SearchQuery } from "./search";
import { parseContextFile, splitSections } from "./spec";
import { statsFor, store } from "./store";
import type { AfriContext, Category, ContextStatus, ContextType, SpecSectionKey, Tool } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "contexts");

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v.join(", ") : (v ?? "");
}
function arr(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

export function toContext(raw: string, fallbackStatus: ContextStatus = "pending"): AfriContext {
  const { meta, body } = parseContextFile(raw);
  const slug = str(meta.slug);
  const sections = splitSections(body) as Record<SpecSectionKey, string>;
  return {
    slug,
    title: str(meta.title),
    service: str(meta.service),
    description: str(meta.description),
    type: (str(meta.type) || "cursorrules") as ContextType,
    category: (str(meta.category) || "paiement") as Category,
    pays: arr(meta.pays),
    version_api: str(meta.version_api),
    source_url: str(meta.source_url),
    tested_with: arr(meta.tested_with) as Tool[],
    last_verified_at: str(meta.last_verified_at),
    tags: arr(meta.tags),
    status: (str(meta.status) || fallbackStatus) as ContextStatus,
    author: { name: str(meta.author) || "Anonyme", github: str(meta.github) },
    sandbox: (str(meta.sandbox) || undefined) as AfriContext["sandbox"],
    sections,
    body,
    stats: statsFor(slug),
    proof: PROOFS[slug],
  };
}

let fileCache: { raw: string; ctx: AfriContext }[] | null = null;

function fileContexts() {
  if (!fileCache || process.env.NODE_ENV !== "production") {
    fileCache = fs
      .readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
        return { raw, ctx: toContext(raw, "approved") };
      });
  }
  return fileCache;
}

/** Tous les contextes, quel que soit leur statut. Utilisé par le back-office. */
export function allContexts(): AfriContext[] {
  const s = store();
  const fromFiles = fileContexts().map(({ ctx }) => ctx);
  const fromSubmissions = s.submissions.map((sub) => {
    const ctx = toContext(sub.raw, "pending");
    ctx.author = { name: sub.author, github: sub.author };
    ctx.status = "pending";
    return ctx;
  });
  return [...fromSubmissions, ...fromFiles].map((ctx) => ({
    ...ctx,
    status: s.status.get(ctx.slug) ?? ctx.status,
    stats: statsFor(ctx.slug),
  }));
}

/** Contextes visibles par le public : approuvés, ou approuvés puis signalés à revérifier. */
export function publicContexts(): AfriContext[] {
  return allContexts()
    .filter((c) => c.status === "approved" || c.status === "to_recheck")
    .sort((a, b) => b.stats.installs - a.stats.installs);
}

export function getContext(slug: string): AfriContext | undefined {
  return allContexts().find((c) => c.slug === slug);
}

export function searchContexts(query: SearchQuery, list = publicContexts()): AfriContext[] {
  return filterContexts(list, query);
}

export function impactTotals() {
  const list = allContexts();
  const copies = list.reduce((n, c) => n + c.stats.copies, 0);
  const installs = list.reduce((n, c) => n + c.stats.installs, 0);
  return { copies, installs, contexts: publicContexts().length };
}
