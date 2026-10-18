"use client";

import { useEffect, useRef, useState } from "react";
import type { Proof, ProofLang } from "@/lib/types";
import { LangTabs, useCodeLang } from "./code-tabs";
import { CodeView } from "./code-view";
import { Stamp, formatStampDate } from "./stamp";

type Mode = "without" | "with";

/**
 * Même prompt, deux réponses. L'animation se joue une fois au chargement (sans → avec), sauf si le
 * visiteur préfère réduire les animations ou clique d'abord sur le bouton.
 */
export function ProofDiff({
  proof,
  verifiedAt,
  sourceUrl,
  autoplay = false,
  compact = false,
}: {
  proof: Proof;
  verifiedAt: string;
  sourceUrl: string;
  autoplay?: boolean;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("without");
  const [stampKey, setStampKey] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    if (!autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      if (touched.current) return;
      setMode("with");
      setStampKey((k) => k + 1);
    }, 2600);
    return () => clearTimeout(t);
  }, [autoplay]);

  const choose = (m: Mode) => {
    touched.current = true;
    if (m === "with" && mode !== "with") setStampKey((k) => k + 1);
    setMode(m);
  };

  const langs = ["ts", ...Object.keys(proof.variants ?? {})];
  const [lang, setLang] = useCodeLang(langs);
  const shown = { ...proof, ...(lang === "ts" ? {} : proof.variants?.[lang as ProofLang]) };

  const isWith = mode === "with";
  const marks = isWith
    ? shown.fixes.map((text) => ({ text, kind: "fixed" as const }))
    : shown.inventions.map((i) => ({ text: i.text, kind: "invented" as const, note: i.note }));

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-trait bg-nuit-2 shadow-[0_40px_120px_-40px_rgb(5_6_30/0.9)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-trait px-4 py-3 sm:px-5">
        <p className="code min-w-0 flex-1 truncate text-brume">
          <span className="text-safran">›</span> {shown.prompt}
        </p>
        {langs.length > 1 ? <LangTabs langs={langs} value={lang} onChange={setLang} /> : null}
        <div role="tablist" aria-label="Sortie de l'IA" className="flex rounded-full border border-trait bg-nuit p-1 text-sm">
          <button
            role="tab"
            aria-selected={!isWith}
            onClick={() => choose("without")}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${!isWith ? "bg-erreur/15 text-[#ffb3aa]" : "text-brume hover:text-craie"}`}
          >
            Sans contexte
          </button>
          <button
            role="tab"
            aria-selected={isWith}
            onClick={() => choose("with")}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${isWith ? "bg-tampon/15 text-[#b9f2d8]" : "text-brume hover:text-craie"}`}
          >
            Avec AfriContext
          </button>
        </div>
      </div>

      <div className={`relative px-2 py-4 sm:px-4 ${compact ? "max-h-[420px] overflow-y-auto scroll-thin" : ""}`} role="tabpanel">
        <CodeView key={mode + lang} code={isWith ? shown.withContext : shown.without} marks={marks} showNotes={!isWith} />
        {isWith ? (
          <div key={stampKey} className="pointer-events-none absolute right-3 top-3 sm:right-8 sm:top-6">
            <Stamp ring="Vérifié sur la doc officielle" center={formatStampDate(verifiedAt)} sub="AFRICONTEXT" animate size={compact ? 104 : 136} />
          </div>
        ) : null}
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-trait px-4 py-3 text-sm sm:px-5">
        <span className={`code rounded-md px-2 py-0.5 ${isWith ? "bg-tampon/15 text-tampon" : "bg-erreur/15 text-erreur"}`}>
          {isWith ? proof.withResult : proof.withoutResult}
        </span>
        <span className="text-brume">
          {isWith
            ? `${shown.fixes.length} éléments conformes à la documentation`
            : `${shown.inventions.length} inventions de l'IA`}
        </span>
        <span className="text-voile">Modèle testé : {proof.model}</span>
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="ml-auto text-brume underline decoration-trait underline-offset-4 hover:text-craie">
          Documentation source
        </a>
      </figcaption>
    </figure>
  );
}
