import Link from "next/link";
import { AfricaGlobe } from "@/components/africa-globe";
import { ContextRow, formatNumber } from "@/components/context-row";
import { CopyCommand } from "@/components/copy-command";
import { ProofDiff } from "@/components/proof-diff";
import { Stamp } from "@/components/stamp";
import { coverageGlobe, getContext, impactTotals, publicContexts } from "@/lib/catalog";
import { MINUTES_SAVED_PER_INSTALL } from "@/lib/store";

export const dynamic = "force-dynamic";

const LOOP = [
  {
    who: "L'ingénieur",
    what: "écrit le contexte depuis la documentation officielle, au format AfriContext Spec. Le formulaire refuse toute source absente et toute clé en clair.",
    code: "source_url: https://docs.wave.com/checkout",
  },
  {
    who: "La plateforme",
    what: "valide les huit sections, garde le contexte en attente jusqu'à la relecture humaine, puis surveille la doc source pour signaler tout changement.",
    code: "status: pending → approved",
  },
  {
    who: "Le vibe codeur",
    what: "installe le contexte dans son projet en une commande. Cursor ou Claude Code le lit, et le code généré passe contre la sandbox.",
    code: "npx africontext add wave-checkout-api",
  },
];

const COMPARE: [string, string, string][] = [
  ["Preuve que ça marche", "Non vérifiable", "Sortie de l'IA sans puis avec contexte, sur chaque fiche"],
  ["Installation", "Copier-coller à la main", "npx africontext add <slug>"],
  ["Test du code généré", "À l'aveugle", "Sandboxes Wave, Orange Money et FedaPay avec webhooks"],
  ["Format", "Texte libre", "AfriContext Spec, validée à la soumission"],
  ["Obsolescence", "Personne ne regarde", "Empreinte de la doc source comparée chaque nuit"],
  ["Contribution", "Rédaction manuelle", "Brouillon généré depuis l'URL de la doc, relu par un humain"],
];

export default function Home() {
  const wave = getContext("wave-checkout-api")!;
  const top = publicContexts().slice(0, 6);
  const totals = impactTotals();
  const hours = Math.round((totals.installs * MINUTES_SAVED_PER_INSTALL) / 60);
  const globe = coverageGlobe();

  return (
    <>
      {/* Bandeau d'accueil */}
      <section className="adire relative overflow-hidden">
        <div className="relative mx-auto max-w-[1240px] px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-16 xl:gap-20">
            {/* Globe décoratif : les pays déjà couverts par le catalogue */}
            <AfricaGlobe
              points={globe.points}
              links={globe.links}
              label={`Globe des ${globe.points.length} pays couverts par le catalogue`}
              className="pointer-events-none -my-10 hidden h-[480px] w-[480px] shrink-0 opacity-80 lg:block xl:h-[580px] xl:w-[580px]"
            />
            <h1 className="max-w-[16ch] text-display font-semibold lg:justify-self-end lg:text-[clamp(3.5rem,5.6vw,5.75rem)]" aria-label="L'IA invente /v1/pay. AfriContext lui donne la vraie documentation.">
              <span className="display-wide block">L&apos;IA invente</span>
              <span className="relative mt-2 inline-block font-mono text-[0.62em] font-normal tracking-[-0.04em] text-erreur" aria-hidden="true">
                /v1/pay
                <span className="absolute left-[-0.06em] right-[-0.06em] top-[54%] h-[0.09em] -rotate-2 bg-erreur" />
              </span>
            </h1>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
            <p className="max-w-[44ch] text-[1.3rem] leading-[1.45] text-brume sm:text-[1.5rem]">
              Wave n&apos;a jamais eu cet endpoint. AfriContext donne à Cursor et Claude Code la vraie documentation de Wave, Orange Money,
              FedaPay et des services africains, vérifiée et installable en une commande.
            </p>
            <div className="space-y-3">
              <CopyCommand text="npx africontext add wave-checkout-api" slug="wave-checkout-api" />
              <Link href="/contextes" className="block px-1 text-sm text-brume underline decoration-trait underline-offset-4 hover:text-craie">
                Voir les {totals.contexts} contextes du catalogue
              </Link>
            </div>
          </div>

          <div className="mt-14">
            {wave.proof ? <ProofDiff proof={wave.proof} verifiedAt={wave.last_verified_at} sourceUrl={wave.source_url} autoplay /> : null}
          </div>

          <p className="mt-8 text-sm text-voile">
            Contextes vérifiés pour Wave, Orange Money, FedaPay, MTN MoMo, M-Pesa, Paystack, CinetPay, Flutterwave, Africa&apos;s Talking et
            l&apos;API SMS d&apos;Orange.
          </p>
        </div>
      </section>

      {/* La boucle : une vraie séquence d'utilisation */}
      <section className="border-t border-trait/60">
        <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
          <h2 className="max-w-[20ch] text-title font-semibold display-narrow">De la doc officielle à l&apos;IDE, en trois mains.</h2>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-trait bg-trait md:grid-cols-3">
            {LOOP.map((step, i) => (
              <li key={step.who} className="flex flex-col bg-nuit p-6 sm:p-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-safran text-sm font-semibold text-safran">
                  {i + 1}
                </span>
                <h3 className="mt-6 text-xl font-semibold">{step.who}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-brume">{step.what}</p>
                <code className="code mt-8 block truncate rounded-lg bg-nuit-2 px-3 py-2 text-brume">{step.code}</code>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[60ch] text-sm text-voile">
            Les votes et les signalements des vibe codeurs reviennent à l&apos;ingénieur, qui met le contexte à jour.
          </p>
        </div>
      </section>

      {/* Aperçu du catalogue */}
      <section className="border-t border-trait/60">
        <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[18ch] text-title font-semibold display-narrow">Les plus installés cette semaine.</h2>
            <Link href="/contextes" className="rounded-full border border-trait px-5 py-2.5 text-sm hover:border-brume">
              Ouvrir le catalogue
            </Link>
          </div>
          <ul className="mt-10 border-t border-trait/70">
            {top.map((c) => (
              <ContextRow key={c.slug} ctx={c} />
            ))}
          </ul>
        </div>
      </section>

      {/* Comparaison avant / après */}
      <section className="border-t border-trait/60">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <h2 className="text-title font-semibold display-narrow">Un annuaire de prompts ne suffit pas.</h2>
            <p className="mt-6 leading-relaxed text-brume">
              Un prompt qu&apos;on ne peut ni prouver, ni installer, ni tester finit copié-collé, puis oublié quand l&apos;API change.
            </p>
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-brume">
                  <th scope="col" className="w-[28%] pb-4 font-normal" />
                  <th scope="col" className="w-[28%] pb-4 font-normal">Annuaire classique</th>
                  <th scope="col" className="pb-4 font-semibold text-craie">AfriContext</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-trait/70">
                    <th scope="row" className="py-4 pr-4 font-medium">{k}</th>
                    <td className="py-4 pr-4 text-voile line-through decoration-voile/40">{a}</td>
                    <td className="py-4 text-craie">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="border-t border-trait/60">
        <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-safran px-6 py-14 text-nuit sm:px-12">
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-90 sm:right-10 sm:top-8">
              <Stamp ring="Temps rendu aux développeurs" center={`${formatNumber(hours)} h`} tone="tampon" size={150} rotate={12} className="!text-nuit" />
            </div>
            <p className="max-w-[24ch] text-title font-semibold display-narrow">
              {formatNumber(totals.installs)} installations. Autant d&apos;endpoints que personne n&apos;a eu à deviner.
            </p>
            <p className="mt-6 max-w-[56ch] text-[1.05rem] leading-relaxed text-nuit/80">
              {formatNumber(totals.copies)} copies depuis le site. Le temps gagné est estimé à {MINUTES_SAVED_PER_INSTALL} minutes par
              installation, une estimation du temps passé à corriger une intégration inventée.
            </p>
            <Link href="/impact" className="mt-8 inline-block rounded-full bg-nuit px-5 py-2.5 text-sm font-semibold text-craie hover:bg-nuit-3">
              Voir les compteurs par contexte
            </Link>
          </div>
        </div>
      </section>

      {/* Contribuer */}
      <section className="border-t border-trait/60">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-24 sm:px-6 md:grid-cols-2 md:items-center">
          <h2 className="text-title font-semibold display-narrow">Vous avez déjà intégré un service local ? Publiez la doc que vous auriez aimé avoir.</h2>
          <div>
            <p className="leading-relaxed text-brume">
              Collez l&apos;URL de la documentation officielle. AfriContext prépare un brouillon au format Spec, vous le relisez, un modérateur
              le valide. Comptez moins d&apos;une minute.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contribuer" className="rounded-full bg-safran px-5 py-2.5 text-sm font-semibold text-nuit hover:bg-safran-2">
                Publier un contexte
              </Link>
              <Link href="/spec" className="rounded-full border border-trait px-5 py-2.5 text-sm hover:border-brume">
                Lire la Spec
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
