// Crée (ou promeut) le compte administrateur directement en base, sans passer par l'inscription.
// Usage : pnpm db:seed-admin
// Lit dans .env : ADMIN_SEED_EMAIL (sinon le premier de ADMIN_EMAILS), ADMIN_SEED_NAME, ADMIN_SEED_PASSWORD.
// Le compte existe déjà ? Son rôle passe à admin et son mot de passe est remplacé.
// Une fois le compte créé, ADMIN_SEED_PASSWORD peut être retiré de .env.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import pg from "pg";

const BCRYPT_COST = 12; // même coût que src/lib/users.ts

const email = (process.env.ADMIN_SEED_EMAIL || (process.env.ADMIN_EMAILS ?? "").split(",")[0] || "").trim().toLowerCase();
const nom = (process.env.ADMIN_SEED_NAME ?? "").trim().slice(0, 80);
const password = process.env.ADMIN_SEED_PASSWORD ?? "";

function fail(msg) {
  console.error(`[seed-admin] ${msg}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) fail("DATABASE_URL manquant dans .env.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("ADMIN_SEED_EMAIL (ou ADMIN_EMAILS) manquant ou invalide.");
if (nom.length < 2) fail("ADMIN_SEED_NAME manquant (2 caractères minimum).");
if (password.length < 10 || password.length > 128) fail("ADMIN_SEED_PASSWORD doit faire entre 10 et 128 caractères.");

/** Même format d'identifiant que handleFor() dans src/lib/users.ts. */
function handleFor(name) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return (base || "dev") + "-" + randomBytes(2).toString("hex");
}

const caPath = process.env.DATABASE_CA_CERT;
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: caPath ? { ca: readFileSync(caPath, "utf8") } : undefined,
});

await client.connect();
try {
  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const { rows } = await client.query(
    `insert into "User" (id, nom, email, mot_de_passe_hash, role)
     values ($1, $2, $3, $4, 'admin')
     on conflict (email) do update set nom = excluded.nom, mot_de_passe_hash = excluded.mot_de_passe_hash, role = 'admin'
     returning id, (xmax = 0) as created`,
    [handleFor(nom), nom, email, hash],
  );
  const { id, created } = rows[0];
  console.log(`[seed-admin] ${created ? "Compte créé" : "Compte existant promu admin"} : ${email} (id ${id}).`);
} finally {
  await client.end();
}
