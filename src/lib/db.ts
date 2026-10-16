import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Client Prisma partagé. Sans DATABASE_URL, renvoie null et l'application tourne sur le
 * cache mémoire seul (développement local, démo hors ligne).
 * Rangé dans globalThis car pages et routes API ont chacune leur copie de ce module.
 */
const g = globalThis as unknown as { __afxPrisma?: PrismaClient; __afxQueue?: Promise<unknown> };

export function db(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  g.__afxPrisma ??= new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  return g.__afxPrisma;
}

/**
 * Écrit en base sans bloquer la réponse. Les écritures passent l'une après l'autre,
 * dans l'ordre des requêtes, pour qu'un vote puis son annulation arrivent dans le bon ordre.
 * Renvoie une promesse que l'appelant peut attendre s'il a besoin de la confirmation.
 */
export function persist(label: string, write: (p: PrismaClient) => Promise<unknown>): Promise<void> {
  const p = db();
  if (!p) return Promise.resolve();
  const next = (g.__afxQueue ?? Promise.resolve()).then(() => write(p)).then(
    () => undefined,
    (err: unknown) => console.error(`[db] échec de l'écriture « ${label} » :`, err),
  );
  g.__afxQueue = next;
  return next;
}
