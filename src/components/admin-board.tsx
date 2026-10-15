"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface QueueItem {
  slug: string;
  title: string;
  service: string;
  author: string;
  source_url: string;
  sectionsOk: number;
  sectionsTotal: number;
  secrets: number;
  type: string;
}

export interface WatchRow {
  slug: string;
  title: string;
  status: string;
  last_verified_at: string;
}

interface WatchResult {
  slug: string;
  outcome: "baseline" | "unchanged" | "changed" | "unreachable";
}

const OUTCOME: Record<WatchResult["outcome"], { label: string; cls: string }> = {
  baseline: { label: "Empreinte enregistrée", cls: "text-brume" },
  unchanged: { label: "Inchangée", cls: "text-tampon" },
  changed: { label: "Modifiée, passée à revérifier", cls: "text-erreur" },
  unreachable: { label: "Injoignable", cls: "text-safran-2" },
};

export function AdminBoard({
  queue,
  watched,
  reports,
}: {
  queue: QueueItem[];
  watched: WatchRow[];
  reports: { slug: string; reason: string; at: number }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busySlug, setBusySlug] = useState("");
  const [watching, setWatching] = useState(false);
  const [results, setResults] = useState<Record<string, WatchResult["outcome"]>>({});
  const [ranAt, setRanAt] = useState("");

  const act = async (slug: string, action: string) => {
    setBusySlug(slug + action);
    await fetch("/api/admin/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, action }) });
    setBusySlug("");
    startTransition(() => router.refresh());
  };

  const watch = async () => {
    setWatching(true);
    const res = await fetch("/api/admin/watch", { method: "POST" });
    const data = (await res.json()) as { ranAt: string; results: WatchResult[] };
    setResults(Object.fromEntries(data.results.map((r) => [r.slug, r.outcome])));
    setRanAt(new Date(data.ranAt).toLocaleTimeString("fr-FR"));
    setWatching(false);
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-16">
      <section aria-labelledby="file">
        <h2 id="file" className="text-2xl font-semibold">
          En attente de validation <span className="text-voile">({queue.length})</span>
        </h2>
        {queue.length ? (
          <ul className="mt-6 divide-y divide-trait/70 border-y border-trait/70">
            {queue.map((q) => {
              const clean = q.secrets === 0 && q.sectionsOk === q.sectionsTotal;
              return (
                <li key={q.slug} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">
                      <Link href={`/contextes/${q.slug}`} className="hover:text-safran-2">
                        {q.title}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-voile">
                      {q.service}, proposé par @{q.author}, format {q.type}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className={q.sectionsOk === q.sectionsTotal ? "text-tampon" : "text-safran-2"}>
                        Spec : {q.sectionsOk}/{q.sectionsTotal} sections
                      </span>
                      <span className={q.secrets ? "text-erreur" : "text-tampon"}>{q.secrets ? `${q.secrets} secret(s) détecté(s)` : "Aucun secret"}</span>
                      <a href={q.source_url} target="_blank" rel="noreferrer" className="truncate text-brume underline decoration-trait underline-offset-4">
                        Vérifier la source
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(q.slug, "approve")}
                      disabled={!clean || Boolean(busySlug) || pending}
                      title={clean ? undefined : "La Spec doit être complète et sans secret"}
                      className="rounded-full bg-tampon px-4 py-2 text-sm font-semibold text-nuit disabled:opacity-40"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => act(q.slug, "reject")}
                      disabled={Boolean(busySlug) || pending}
                      className="rounded-full border border-erreur/50 px-4 py-2 text-sm text-erreur hover:bg-erreur/10 disabled:opacity-40"
                    >
                      Rejeter
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-brume">Rien à valider. Les nouvelles soumissions apparaîtront ici.</p>
        )}
      </section>

      <section aria-labelledby="veille">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="veille" className="text-2xl font-semibold">
              Veille des documentations
            </h2>
            <p className="mt-2 max-w-[60ch] text-brume">
              Compare l&apos;empreinte de chaque doc officielle avec la précédente. Un changement passe le contexte à revérifier. Planifiée
              chaque nuit, lançable à la main.
            </p>
          </div>
          <button onClick={watch} disabled={watching} className="rounded-full bg-safran px-5 py-2.5 text-sm font-semibold text-nuit hover:bg-safran-2 disabled:opacity-60">
            {watching ? "Veille en cours…" : "Lancer la veille"}
          </button>
        </div>
        {ranAt ? <p className="mt-3 text-sm text-voile">Dernier passage à {ranAt}</p> : null}
        <div className="mt-6 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-voile">
              <tr>
                <th scope="col" className="pb-3 font-normal">Contexte</th>
                <th scope="col" className="pb-3 font-normal">Statut</th>
                <th scope="col" className="pb-3 font-normal">Dernière veille</th>
                <th scope="col" className="pb-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {watched.map((w) => (
                <tr key={w.slug} className="border-t border-trait/70">
                  <td className="py-3 pr-4">{w.title}</td>
                  <td className="py-3 pr-4">
                    {w.status === "to_recheck" ? <span className="text-erreur">À revérifier</span> : <span className="text-tampon">Vérifié</span>}
                  </td>
                  <td className={`py-3 pr-4 ${results[w.slug] ? OUTCOME[results[w.slug]].cls : "text-voile"}`}>
                    {results[w.slug] ? OUTCOME[results[w.slug]].label : "Pas encore lancée"}
                  </td>
                  <td className="py-3 text-right">
                    {w.status === "to_recheck" ? (
                      <button onClick={() => act(w.slug, "approve")} className="text-sm text-tampon hover:underline">
                        Marquer revérifié
                      </button>
                    ) : (
                      <button onClick={() => act(w.slug, "simulate-change")} className="text-sm text-voile hover:text-craie">
                        Simuler un changement de doc
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="signalements">
        <h2 id="signalements" className="text-2xl font-semibold">
          Signalements <span className="text-voile">({reports.length})</span>
        </h2>
        {reports.length ? (
          <ul className="mt-6 divide-y divide-trait/70 border-y border-trait/70">
            {reports.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/contextes/${r.slug}`} className="font-medium hover:text-safran-2">
                    {r.slug}
                  </Link>
                  <p className="mt-1 text-sm text-brume">{r.reason}</p>
                </div>
                <time className="text-xs text-voile" dateTime={new Date(r.at).toISOString()}>
                  {new Date(r.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </time>
                <button onClick={() => act(r.slug, "recheck")} className="rounded-full border border-trait px-3 py-1.5 text-sm text-brume hover:text-craie">
                  Passer à revérifier
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-brume">Aucun signalement.</p>
        )}
      </section>
    </div>
  );
}
