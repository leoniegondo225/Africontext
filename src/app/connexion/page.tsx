import type { Metadata } from "next";
import { getSession, githubConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "github-non-configure": "La connexion GitHub n'est pas encore configurée sur ce serveur. Utilisez la connexion démo ci-dessous.",
  "etat-invalide": "La connexion a expiré. Recommencez depuis cette page.",
  github: "GitHub a refusé la connexion. Recommencez, ou vérifiez que l'application OAuth est autorisée.",
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const user = await getSession();
  const demo = !githubConfigured() || process.env.DEMO_LOGIN === "1";

  return (
    <div className="mx-auto max-w-md px-4 pt-20">
      <h1 className="text-title font-semibold display-narrow">{user ? `Connecté : ${user.login}` : "Connexion"}</h1>
      <p className="mt-4 leading-relaxed text-brume">
        La connexion sert à publier des contextes et à bâtir votre réputation. Consulter et installer ne demande aucun compte.
      </p>

      {erreur && ERRORS[erreur] ? (
        <p role="alert" className="mt-6 rounded-lg border border-erreur/40 bg-erreur/10 px-4 py-3 text-sm text-[#ffb3aa]">
          {ERRORS[erreur]}
        </p>
      ) : null}

      {user ? (
        <form action="/api/auth/logout" method="post" className="mt-8">
          <button className="rounded-full border border-trait px-5 py-2.5 text-sm hover:border-brume">Se déconnecter</button>
        </form>
      ) : (
        <div className="mt-8 space-y-4">
          <a
            href="/api/auth/github"
            className="flex items-center justify-center gap-3 rounded-full bg-craie px-5 py-3 font-semibold text-nuit hover:bg-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
            </svg>
            Continuer avec GitHub
          </a>
          {demo ? (
            <div className="rounded-2xl border border-trait p-5">
              <p className="text-sm text-brume">Connexion démo pour le jury, sans compte GitHub.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action="/api/auth/demo" method="post">
                  <input type="hidden" name="role" value="user" />
                  <button className="rounded-full border border-trait px-4 py-2 text-sm hover:border-brume">Contributeur</button>
                </form>
                <form action="/api/auth/demo" method="post">
                  <input type="hidden" name="role" value="admin" />
                  <button className="rounded-full border border-trait px-4 py-2 text-sm hover:border-brume">Administrateur</button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
