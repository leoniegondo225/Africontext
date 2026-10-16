import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { SessionUser } from "./auth";
import { db } from "./db";

/**
 * Comptes par email et mot de passe (F3). Les mots de passe sont hachés avec bcrypt (cahier §9).
 * Sans base de données, les comptes vivent en mémoire et disparaissent au redémarrage.
 */

const BCRYPT_COST = 12;

interface Account {
  id: string;
  nom: string;
  email: string;
  hash: string;
  role: "user" | "admin";
}

const g = globalThis as unknown as { __afxAccounts?: Map<string, Account>; __afxDummyHash?: Promise<string> };
function memory() {
  g.__afxAccounts ??= new Map();
  return g.__afxAccounts;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email);
}

/** Identifiant public lisible, sans l'email : « leonie-gondo-4f2a ». */
function handleFor(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return (base || "dev") + "-" + randomBytes(2).toString("hex");
}

function toSession(a: Pick<Account, "id" | "nom" | "role">): SessionUser {
  return { login: a.id, name: a.nom, avatar: "", role: a.role };
}

async function findByEmail(email: string): Promise<Account | null> {
  const p = db();
  if (!p) return memory().get(email) ?? null;
  const u = await p.user.findUnique({ where: { email } });
  if (!u?.mot_de_passe_hash) return null;
  return { id: u.id, nom: u.nom, email, hash: u.mot_de_passe_hash, role: u.role };
}

export type RegisterResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function registerAccount(nomRaw: string, emailRaw: string, password: string): Promise<RegisterResult> {
  const nom = nomRaw.trim().slice(0, 80);
  const email = normalizeEmail(emailRaw);
  if (nom.length < 2) return { ok: false, error: "nom" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, error: "email" };
  if (password.length < 10 || password.length > 128) return { ok: false, error: "mot-de-passe" };
  if (await findByEmail(email)) return { ok: false, error: "email-pris" };

  const account: Account = { id: handleFor(nom), nom, email, hash: await bcrypt.hash(password, BCRYPT_COST), role: isAdminEmail(email) ? "admin" : "user" };
  const p = db();
  if (p) {
    try {
      await p.user.create({ data: { id: account.id, nom, email, mot_de_passe_hash: account.hash, role: account.role } });
    } catch {
      // Course entre deux inscriptions avec le même email : la contrainte unique tranche.
      return { ok: false, error: "email-pris" };
    }
  } else memory().set(email, account);
  return { ok: true, user: toSession(account) };
}

/** Renvoie null si l'email est inconnu ou le mot de passe faux, sans dire lequel des deux. */
export async function verifyAccount(emailRaw: string, password: string): Promise<SessionUser | null> {
  const account = await findByEmail(normalizeEmail(emailRaw));
  // On compare quand même contre un hash factice pour que la durée ne trahisse pas l'existence du compte.
  g.__afxDummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_COST);
  const ok = await bcrypt.compare(password, account?.hash ?? (await g.__afxDummyHash));
  return account && ok ? toSession(account) : null;
}
