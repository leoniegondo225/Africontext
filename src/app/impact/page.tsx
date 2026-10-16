import type { Metadata } from "next";
import Link from "next/link";
import { AfricaGlobe } from "@/components/africa-globe";
import { formatNumber } from "@/components/context-row";
import { coverageGlobe, impactTotals, publicContexts } from "@/lib/catalog";
import { countryName } from "@/lib/countries";
import { MINUTES_SAVED_PER_INSTALL } from "@/lib/store";

export const metadata: Metadata = { title: "Impact" };
export const dynamic = "force-dynamic";

export default function ImpactPage() {
  const list = publicContexts();
  const totals = impactTotals();
  const hours = Math.round((totals.installs * MINUTES_SAVED_PER_INSTALL) / 60);
  const max = Math.max(...list.map((c) => c.stats.installs + c.stats.copies));

  // Carte de couverture : pays × services, pour montrer où le catalogue a des trous.
  const services = [...new Set(list.filter((c) => c.category !== "outillage").map((c) => c.service))];
  const countries = [...new Set(list.flatMap((c) => c.pays))].sort((a, b) => countryName(a).localeCompare(countryName(b), "fr"));
  const globe = coverageGlobe(list);
  const covered = new Map(list.flatMap((c) => c.pays.map((p) => [`${p}:${c.service}`, c.slug] as const)));

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="text-title font-semibold display-narrow">Impact</h1>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-trait bg-trait sm:grid-cols-3">
        {[
          ["Installations", formatNumber(totals.installs), "Par la CLI et le site"],
          ["Copies", formatNumber(totals.copies), "Depuis les fiches"],
          ["Heures gagnées, estimées", formatNumber(hours), `${MINUTES_SAVED_PER_INSTALL} min par installation`],
        ].map(([k, v, note]) => (
          <div key={k} className="bg-nuit p-6 sm:p-8">
            <dt className="text-brume">{k}</dt>
            <dd className="mt-3 text-5xl font-semibold tabular-nums display-narrow">{v}</dd>
            <dd className="mt-2 text-sm text-voile">{note}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-20" aria-labelledby="par-contexte">
        <h2 id="par-contexte" className="text-2xl font-semibold">
          Par contexte
        </h2>
        <ul className="mt-6 space-y-3">
          {list.map((c) => {
            const total = c.stats.installs + c.stats.copies;
            return (
              <li key={c.slug} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-4 text-sm">
                <Link href={`/contextes/${c.slug}`} className="truncate hover:text-safran-2">
                  {c.service}
                </Link>
                <div className="flex h-3 overflow-hidden rounded-full bg-nuit-2" role="img" aria-label={`${c.stats.installs} installations, ${c.stats.copies} copies`}>
                  <span className="h-full bg-safran" style={{ width: `${(c.stats.installs / max) * 100}%` }} />
                  <span className="h-full bg-safran/35" style={{ width: `${(c.stats.copies / max) * 100}%` }} />
                </div>
                <span className="w-16 text-right tabular-nums text-brume">{formatNumber(total)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex gap-5 text-sm text-voile">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-safran" aria-hidden="true" /> Installations
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-safran/35" aria-hidden="true" /> Copies
          </span>
        </p>
      </section>

      <section className="mt-24" aria-labelledby="couverture">
        <h2 id="couverture" className="text-2xl font-semibold">
          Carte de couverture
        </h2>
        <p className="mt-2 max-w-[60ch] text-brume">Chaque case vide est un service qu&apos;aucun contexte ne couvre encore dans ce pays.</p>
        <div className="mt-8 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <AfricaGlobe
            points={globe.points}
            links={globe.links}
            interactive
            label={`Globe interactif des ${globe.points.length} pays couverts`}
            className="mx-auto aspect-square w-full max-w-[560px]"
          />
          <p className="text-sm leading-relaxed text-voile">
            Faites tourner le globe. Chaque point vert est un pays couvert, d&apos;autant plus gros qu&apos;il a de contextes. Un arc relie deux pays
            qui partagent un même service, comme Wave entre le Sénégal et la Côte d&apos;Ivoire.
          </p>
        </div>
        <div className="mt-8 overflow-x-auto scroll-thin">
          <table className="border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 bg-nuit" />
                {services.map((s) => (
                  <th key={s} scope="col" className="h-36 w-10 align-bottom font-normal text-brume">
                    <span className="inline-block origin-bottom-left translate-x-5 -rotate-60 whitespace-nowrap">{s}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countries.map((p) => (
                <tr key={p}>
                  <th scope="row" className="sticky left-0 whitespace-nowrap bg-nuit pr-3 text-left font-normal text-brume">
                    {countryName(p)}
                  </th>
                  {services.map((s) => {
                    const slug = covered.get(`${p}:${s}`);
                    return (
                      <td key={s} className="p-0">
                        {slug ? (
                          <Link href={`/contextes/${slug}`} className="block h-8 w-10 rounded bg-tampon/70 hover:bg-tampon" aria-label={`${s} au ${countryName(p)}`} />
                        ) : (
                          <Link
                            href="/contribuer"
                            className="block h-8 w-10 rounded border border-dashed border-trait hover:border-safran"
                            aria-label={`Publier ${s} pour ${countryName(p)}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
