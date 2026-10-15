import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOOL_LABEL, TYPE_LABEL, formatNumber } from "@/components/context-row";
import { InstallPanel } from "@/components/install-panel";
import { ProofDiff } from "@/components/proof-diff";
import { SafeMarkdown } from "@/components/safe-markdown";
import { Stamp, formatStampDate } from "@/components/stamp";
import { VoteReport } from "@/components/vote-report";
import { VOTER_COOKIE, getSession } from "@/lib/auth";
import { getContext } from "@/lib/catalog";
import { countryName } from "@/lib/countries";
import { SPEC_SECTIONS } from "@/lib/spec";
import { myVote } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ctx = getContext((await params).slug);
  return ctx ? { title: ctx.title, description: ctx.description } : {};
}

export default async function ContextPage({ params }: Params) {
  const { slug } = await params;
  const ctx = getContext(slug);
  const user = await getSession();
  if (!ctx) notFound();
  const visible = ctx.status === "approved" || ctx.status === "to_recheck" || user?.role === "admin";
  if (!visible) notFound();

  const voter = user?.login ?? (await cookies()).get(VOTER_COOKIE)?.value;
  const recheck = ctx.status === "to_recheck";

  return (
    <article className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="text-sm text-voile">
        <Link href="/contextes" className="hover:text-craie">
          Catalogue
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-brume">{ctx.service}</span>
      </nav>

      {ctx.status === "pending" ? (
        <p className="mt-6 rounded-lg border border-safran/40 bg-safran/10 px-4 py-3 text-sm text-safran-2">
          En attente de modération. Seuls les administrateurs voient cette fiche.
        </p>
      ) : null}

      <header className="relative mt-8 grid gap-8 border-b border-trait/70 pb-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="display-narrow text-[clamp(3rem,2rem+5vw,6rem)] font-semibold leading-[0.9]">{ctx.service}</p>
          <h1 className="mt-4 text-2xl font-medium sm:text-3xl">{ctx.title}</h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-brume">{ctx.description}</p>
          <div className="mt-6">
            <VoteReport slug={ctx.slug} up={ctx.stats.up} down={ctx.stats.down} mine={myVote(ctx.slug, voter)} />
          </div>
        </div>
        <div className="flex items-start justify-start lg:justify-end">
          {recheck ? (
            <Stamp ring="Doc source modifiée" center="À REVOIR" sub={formatStampDate(ctx.last_verified_at)} tone="erreur" size={168} rotate={9} />
          ) : (
            <Stamp ring="Vérifié sur la doc officielle" center={formatStampDate(ctx.last_verified_at)} sub={"API " + ctx.version_api} size={168} />
          )}
        </div>
      </header>

      {recheck ? (
        <p className="mt-6 rounded-lg border border-erreur/40 bg-erreur/10 px-4 py-3 text-sm text-[#ffb3aa]">
          La documentation source a changé depuis la dernière vérification. Le contexte reste installable, avec un avertissement en tête de
          fichier, jusqu&apos;à sa revérification.
        </p>
      ) : null}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-16">
          {ctx.proof ? (
            <section aria-labelledby="preuve">
              <h2 id="preuve" className="text-2xl font-semibold">
                Même prompt, avec et sans ce contexte
              </h2>
              <p className="mt-2 max-w-[62ch] text-brume">Les passages barrés sont ceux que l&apos;IA a inventés. Basculez pour voir la sortie avec le contexte.</p>
              <div className="mt-6">
                <ProofDiff proof={ctx.proof} verifiedAt={ctx.last_verified_at} sourceUrl={ctx.source_url} compact />
              </div>
            </section>
          ) : null}

          {ctx.sandbox ? (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-tampon/30 bg-tampon/[0.06] p-6">
              <div>
                <h2 className="font-semibold">Testez le code généré avant de le brancher sur la vraie API</h2>
                <p className="mt-1 text-sm text-brume">Une sandbox {ctx.service} répond comme l&apos;API et envoie un webhook signé.</p>
              </div>
              <Link href={`/sandbox?service=${ctx.sandbox}`} className="rounded-full border border-tampon/50 px-4 py-2 text-sm text-tampon hover:bg-tampon/10">
                Ouvrir la sandbox {ctx.service}
              </Link>
            </section>
          ) : null}

          <div className="space-y-14">
            {SPEC_SECTIONS.map((s) => (
              <section key={s.key} id={s.key} aria-labelledby={`h-${s.key}`} className="scroll-mt-24">
                <h2 id={`h-${s.key}`} className={`text-xl font-semibold ${s.key === "pitfalls" ? "text-erreur" : ""}`}>
                  {s.heading}
                </h2>
                {s.key === "pitfalls" ? <p className="mt-1 text-sm text-voile">Ce que les LLMs inventent le plus souvent pour {ctx.service}.</p> : null}
                <div className="mt-5">
                  <SafeMarkdown source={ctx.sections[s.key] ?? ""} />
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <InstallPanel slug={ctx.slug} isMcp={ctx.type === "mcp_server"} />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-trait p-5 text-sm">
            <div className="col-span-2">
              <dt className="text-voile">Source officielle</dt>
              <dd className="mt-1 break-all">
                <a href={ctx.source_url} target="_blank" rel="noreferrer" className="underline decoration-trait underline-offset-4 hover:text-safran-2">
                  {ctx.source_url.replace(/^https:\/\//, "")}
                </a>
              </dd>
            </div>
            <Meta label="Version d'API" value={ctx.version_api} />
            <Meta label="Vérifié le" value={formatStampDate(ctx.last_verified_at)} />
            <Meta label="Testé avec" value={ctx.tested_with.map((t) => TOOL_LABEL[t] ?? t).join(", ")} />
            <Meta label="Format" value={TYPE_LABEL[ctx.type]} />
            <Meta label="Installations" value={formatNumber(ctx.stats.installs)} />
            <Meta label="Copies" value={formatNumber(ctx.stats.copies)} />
            <div className="col-span-2">
              <dt className="text-voile">Pays</dt>
              <dd className="mt-1 text-brume">{ctx.pays.map(countryName).join(", ")}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-voile">Auteur</dt>
              <dd className="mt-1">
                {ctx.author.name}
                {ctx.author.github ? <span className="text-voile"> @{ctx.author.github}</span> : null}
              </dd>
            </div>
          </dl>

          <nav aria-label="Sections du contexte" className="hidden rounded-2xl border border-trait p-5 lg:block">
            <p className="text-sm text-voile">Sections de la Spec</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {SPEC_SECTIONS.map((s) => (
                <li key={s.key}>
                  <a href={`#${s.key}`} className="text-brume hover:text-craie">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-voile">{label}</dt>
      <dd className="mt-1 tabular-nums">{value}</dd>
    </div>
  );
}
