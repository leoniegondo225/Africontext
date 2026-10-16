/**
 * Exécuté une fois au démarrage du serveur, avant la première requête :
 * recharge PostgreSQL dans le cache mémoire quand DATABASE_URL est défini.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { hydrateFromDatabase } = await import("./lib/persist");
  try {
    await hydrateFromDatabase();
  } catch (err) {
    // Base injoignable : l'application démarre quand même sur le cache mémoire.
    console.error("[db] chargement impossible, démarrage en mémoire seule :", err);
  }
}
