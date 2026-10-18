import { defineConfig } from "prisma/config";

// L'URL n'est requise que pour les migrations ; `prisma generate` s'en passe.
// Avec Supabase, les migrations passent par la connexion directe (DIRECT_URL, port 5432) :
// le pooler en mode transaction (DATABASE_URL, port 6543) ne gère pas les verrous de migration.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
});
