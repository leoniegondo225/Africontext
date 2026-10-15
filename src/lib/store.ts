import type { ContextStats, ContextStatus } from "./types";

/**
 * Stockage en mémoire des votes, événements et de la modération. Sa forme copie les tables
 * Prisma (Votes, Events, Reports, Contexts.status) : passer à PostgreSQL
 * ne demandera de modifier que ce fichier.
 */
export interface Submission {
  id: string;
  slug: string;
  raw: string;
  author: string;
  createdAt: string;
}

export interface EventRow {
  slug: string;
  kind: "copy" | "install";
  at: number;
}

interface Store {
  stats: Map<string, ContextStats>;
  votes: Map<string, 1 | -1>;
  status: Map<string, ContextStatus>;
  submissions: Submission[];
  events: EventRow[];
  reports: { slug: string; reason: string; at: number }[];
  /** Contexts.source_hash : empreinte de la doc officielle lors de la dernière vérification. */
  sourceHashes: Map<string, { hash: string; checkedAt: number }>;
}

const SEED: Record<string, ContextStats> = {
  "wave-checkout-api": { up: 214, down: 3, copies: 1840, installs: 1312 },
  "orange-money-webpay": { up: 167, down: 5, copies: 1205, installs: 874 },
  "fedapay-transactions": { up: 121, down: 2, copies: 902, installs: 655 },
  "mtn-momo-collection": { up: 98, down: 4, copies: 760, installs: 512 },
  "paystack-transactions": { up: 143, down: 6, copies: 1104, installs: 790 },
  "flutterwave-standard": { up: 76, down: 9, copies: 640, installs: 401 },
  "mpesa-daraja-stk-push": { up: 88, down: 1, copies: 590, installs: 433 },
  "africastalking-sms": { up: 64, down: 2, copies: 512, installs: 348 },
  "cinetpay-checkout": { up: 71, down: 3, copies: 488, installs: 302 },
  "orange-sms-api": { up: 39, down: 1, copies: 260, installs: 181 },
  "paydunya-checkout": { up: 0, down: 0, copies: 0, installs: 0 },
  "africontext-mcp-server": { up: 52, down: 0, copies: 230, installs: 410 },
};

const g = globalThis as unknown as { __africontext?: Store };

export function store(): Store {
  if (!g.__africontext) {
    g.__africontext = {
      stats: new Map(Object.entries(SEED).map(([k, v]) => [k, { ...v }])),
      votes: new Map(),
      status: new Map(),
      submissions: [],
      events: [],
      reports: [
        { slug: "flutterwave-standard", reason: "La doc mentionne une v4 de l'API, à vérifier.", at: Date.now() - 1000 * 60 * 60 * 30 },
      ],
      sourceHashes: new Map(),
    };
  }
  return g.__africontext;
}

export function statsFor(slug: string): ContextStats {
  const s = store();
  if (!s.stats.has(slug)) s.stats.set(slug, { up: 0, down: 0, copies: 0, installs: 0 });
  return s.stats.get(slug)!;
}

export function recordEvent(slug: string, kind: EventRow["kind"]): ContextStats {
  const st = statsFor(slug);
  if (kind === "copy") st.copies++;
  else st.installs++;
  store().events.push({ slug, kind, at: Date.now() });
  return st;
}

/** Un vote par votant et par contexte. Revoter la même valeur annule le vote. */
export function vote(slug: string, voter: string, value: 1 | -1): { stats: ContextStats; mine: 0 | 1 | -1 } {
  const s = store();
  const key = voter + ":" + slug;
  const prev = s.votes.get(key);
  const st = statsFor(slug);
  if (prev === 1) st.up--;
  if (prev === -1) st.down--;
  if (prev === value) {
    s.votes.delete(key);
    return { stats: st, mine: 0 };
  }
  s.votes.set(key, value);
  if (value === 1) st.up++;
  else st.down++;
  return { stats: st, mine: value };
}

export function myVote(slug: string, voter: string | undefined): 0 | 1 | -1 {
  if (!voter) return 0;
  return store().votes.get(voter + ":" + slug) ?? 0;
}

/** Minutes gagnées estimées par installation. Valeur provisoire : à remplacer par la valeur mesurée par l'équipe. */
export const MINUTES_SAVED_PER_INSTALL = 47;
