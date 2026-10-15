"use client";

import { useState } from "react";

/**
 * Copie le texte et, si un slug est fourni, enregistre un événement « copie » ou « installation »
 * pour faire avancer les compteurs d'impact.
 */
export function CopyCommand({
  text,
  slug,
  kind = "install",
  label,
  prefix = "$",
  className = "",
}: {
  text: string;
  slug?: string;
  kind?: "copy" | "install";
  label?: string;
  prefix?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
      if (slug) {
        fetch(`/api/contexts/${slug}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        }).catch(() => {});
      }
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 1800);
  };

  return (
    <div className={`group flex min-w-0 items-center gap-3 rounded-xl border border-trait bg-nuit px-4 py-3 ${className}`}>
      <code className="code min-w-0 flex-1 truncate">
        {prefix ? <span className="mr-2 select-none text-voile">{prefix}</span> : null}
        {label ?? text}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg bg-safran px-3 py-1.5 text-sm font-semibold text-nuit transition-colors hover:bg-safran-2"
        aria-live="polite"
      >
        {state === "done" ? "Copié" : state === "error" ? "Échec" : "Copier"}
      </button>
    </div>
  );
}
