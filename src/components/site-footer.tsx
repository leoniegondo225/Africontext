import Link from "next/link";
import { LogoMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-trait/60">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-semibold">AfriContext</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-brume">
            Faire de l&apos;Afrique la première région où l&apos;IA ne se trompe plus sur les services locaux.
          </p>
          <p className="mt-6 text-xs text-voile">
            Équipe Impaact code, CADEV 2026, Systalink Challenge. Hébergé sur l&apos;infrastructure Systalink.
          </p>
        </div>
        <FooterCol
          title="Utiliser"
          links={[
            ["/contextes", "Catalogue"],
            ["/sandbox", "Sandboxes"],
            ["/impact", "Compteurs d'impact"],
          ]}
        />
        <FooterCol
          title="Contribuer"
          links={[
            ["/contribuer", "Publier un contexte"],
            ["/spec", "AfriContext Spec"],
            ["/connexion", "Connexion GitHub"],
          ]}
        />
        <FooterCol
          title="Outils"
          links={[
            ["/spec#cli", "CLI africontext"],
            ["/contextes/africontext-mcp-server", "Serveur MCP"],
            ["/api/contexts", "API publique"],
          ]}
        />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-craie">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-brume hover:text-craie">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
