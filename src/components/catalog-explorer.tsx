"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { countryName } from "@/lib/countries";
import { filterContexts } from "@/lib/search";
import type { AfriContext } from "@/lib/types";
import { ContextRow } from "./context-row";

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "paiement", label: "Paiement" },
  { value: "sms", label: "SMS" },
  { value: "outillage", label: "Outillage" },
];

const SUGGESTIONS = ["paiement mobile", "Sénégal", "Orange", "webhook", "Kenya"];

export function CatalogExplorer({
  contexts,
  initial,
}: {
  contexts: AfriContext[];
  initial: { q: string; pays: string; category: string };
}) {
  const [q, setQ] = useState(initial.q);
  const [pays, setPays] = useState(initial.pays);
  const [category, setCategory] = useState(initial.category);

  const countries = useMemo(() => {
    const count = new Map<string, number>();
    contexts.forEach((c) => c.pays.forEach((p) => count.set(p, (count.get(p) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code);
  }, [contexts]);

  const results = useMemo(() => filterContexts(contexts, { q, pays, category }), [contexts, q, pays, category]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pays) params.set("pays", pays);
    if (category) params.set("categorie", category);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [q, pays, category]);

  const reset = () => {
    setQ("");
    setPays("");
    setCategory("");
  };

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-trait/60 bg-nuit/90 px-4 pb-5 pt-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <label htmlFor="recherche" className="sr-only">
          Rechercher un service, un pays ou un tag
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-trait bg-nuit-2 px-4 focus-within:border-safran">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-voile" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="recherche"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Wave, Sénégal, paiement mobile, webhook…"
            className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-voile"
            autoComplete="off"
          />
          <span className="hidden shrink-0 text-sm tabular-nums text-voile sm:inline" aria-live="polite">
            {results.length} {results.length > 1 ? "contextes" : "contexte"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                category === c.value ? "border-craie bg-craie text-nuit" : "border-trait text-brume hover:border-brume hover:text-craie"
              }`}
            >
              {c.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-trait" aria-hidden="true" />
          <label htmlFor="pays" className="sr-only">
            Pays
          </label>
          <select
            id="pays"
            value={pays}
            onChange={(e) => setPays(e.target.value)}
            className="rounded-full border border-trait bg-nuit px-3.5 py-1.5 text-sm text-brume hover:border-brume"
          >
            <option value="">Tous les pays</option>
            {countries.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {results.length ? (
        <ul className="mt-2">
          {results.map((c) => (
            <ContextRow key={c.slug} ctx={c} />
          ))}
        </ul>
      ) : (
        <div className="mt-16 max-w-xl">
          <p className="text-2xl font-semibold">Aucun contexte pour « {q || countryName(pays)} ».</p>
          <p className="mt-3 leading-relaxed text-brume">
            Essayez un nom de service ou de pays, ou retirez un filtre. Si le service manque vraiment, vous pouvez publier son contexte.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  reset();
                  setQ(s);
                }}
                className="rounded-full border border-trait px-3.5 py-1.5 text-sm text-brume hover:text-craie"
              >
                {s}
              </button>
            ))}
            <Link href="/contribuer" className="rounded-full bg-safran px-3.5 py-1.5 text-sm font-semibold text-nuit">
              Publier ce contexte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
