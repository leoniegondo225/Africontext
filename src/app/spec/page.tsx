import type { Metadata } from "next";
import Link from "next/link";
import { CodeView } from "@/components/code-view";
import { CopyCommand } from "@/components/copy-command";
import { SPEC_SECTIONS } from "@/lib/spec";

export const metadata: Metadata = { title: "AfriContext Spec" };

const FRONT_MATTER = `slug: wave-checkout-api
title: Wave - API Checkout
type: cursorrules          # cursorrules | claude_prompt | mcp_server
service: Wave
pays: [SN, CI]
version_api: v1
source_url: https://docs.wave.com/checkout
tested_with: [cursor, claude-code]
last_verified_at: 2026-10-12
tags: [fintech, paiement-mobile]`;

const FIELD_NOTES: [string, string][] = [
  ["source_url", "Obligatoire. Une URL HTTPS de la documentation officielle. Sans elle, le formulaire refuse le contexte."],
  ["type", "cursorrules, claude_prompt ou mcp_server. Rien d'autre."],
  ["last_verified_at", "La date affichée sur le tampon de la fiche. La veille la remet en question si la doc change."],
  ["tested_with", "Les outils avec lesquels la preuve avant / après a été produite."],
];

const RULES = [
  "Toutes les sections sont présentes et non vides.",
  "Aucun secret : motifs sk_ et pk_, Bearer suivi d'un jeton, JWT, clés PEM, valeurs longues assignées à une clé.",
  "La section Variables d'environnement ne contient que des noms.",
  "Le rendu n'accepte aucun HTML brut : le Markdown est affiché comme du texte.",
  "Chaque contexte reste en attente jusqu'à la validation d'un administrateur.",
];

export default function SpecPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="max-w-[16ch] text-title font-semibold display-narrow">AfriContext Spec</h1>
      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-brume">
        Un format, toujours le même. Les sections sont au même endroit sur chaque fiche, le formulaire le vérifie à la soumission, et un
        éditeur d&apos;API pourra un jour certifier ses propres contextes.
      </p>

      <section className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]" aria-labelledby="entete">
        <div className="min-w-0">
          <h2 id="entete" className="text-2xl font-semibold">
            L&apos;en-tête
          </h2>
          <div className="mt-6 rounded-2xl border border-trait bg-nuit-2 p-4">
            <CodeView code={FRONT_MATTER} marks={[{ text: "https://docs.wave.com/checkout", kind: "fixed" }]} />
          </div>
        </div>
        <dl className="space-y-6 lg:pt-14">
          {FIELD_NOTES.map(([k, v]) => (
            <div key={k}>
              <dt className="code text-safran">{k}</dt>
              <dd className="mt-1 leading-relaxed text-brume">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-24" aria-labelledby="sections">
        <h2 id="sections" className="text-2xl font-semibold">
          Les huit sections, dans cet ordre
        </h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-trait bg-trait sm:grid-cols-2 lg:grid-cols-4">
          {SPEC_SECTIONS.map((s, i) => (
            <li key={s.key} className={`bg-nuit p-6 ${s.key === "pitfalls" ? "bg-[linear-gradient(0deg,rgb(255_107_94/0.08),transparent)]" : ""}`}>
              <span className="text-sm tabular-nums text-voile">{i + 1}</span>
              <h3 className={`mt-3 font-semibold ${s.key === "pitfalls" ? "text-erreur" : ""}`}>{s.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brume">{s.hint}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-[64ch] text-brume">
          La section Pièges courants est celle qui fait la différence : elle dit à l&apos;IA, noir sur blanc, ce qu&apos;elle a l&apos;habitude
          d&apos;inventer pour ce service.
        </p>
      </section>

      <section className="mt-24 grid gap-10 md:grid-cols-2" aria-labelledby="regles">
        <div>
          <h2 id="regles" className="text-2xl font-semibold">
            Règles de validation
          </h2>
          <ul className="mt-6 space-y-3">
            {RULES.map((r) => (
              <li key={r} className="relative pl-6 leading-relaxed text-brume">
                <span className="absolute left-0 top-[0.55em] h-2 w-2 rounded-full bg-tampon" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div id="cli" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold">Installer depuis le terminal</h2>
          <p className="mt-3 leading-relaxed text-brume">
            La CLI écrit le fichier attendu par votre outil : <code className="code">.cursorrules</code>, <code className="code">CLAUDE.md</code> ou{" "}
            <code className="code">AGENTS.md</code>.
          </p>
          <div className="mt-6 space-y-3">
            <CopyCommand text="npx africontext add wave-checkout-api" />
            <CopyCommand text="npx africontext add fedapay-transactions --tool claude-code" />
            <CopyCommand text={'npx africontext search "orange money"'} />
          </div>
          <p className="mt-6 text-sm text-voile">
            Sans CLI : <code className="code">GET /api/contexts/&lt;slug&gt;/raw?tool=cursor</code>. Pour Claude Code et Cursor en MCP, voir le{" "}
            <Link href="/contextes/africontext-mcp-server" className="underline underline-offset-4 hover:text-craie">
              serveur MCP AfriContext
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
