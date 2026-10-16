import { defineConfig } from "prisma/config";

// DATABASE_URL n'est requis que pour les migrations ; `prisma generate` s'en passe.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
