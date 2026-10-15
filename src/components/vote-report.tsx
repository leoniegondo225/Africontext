"use client";

import { useState } from "react";

export function VoteReport({ slug, up, down, mine }: { slug: string; up: number; down: number; mine: 0 | 1 | -1 }) {
  const [state, setState] = useState({ up, down, mine });
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);

  const vote = async (value: 1 | -1) => {
    setBusy(true);
    const res = await fetch(`/api/contexts/${slug}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) setState(await res.json());
    setBusy(false);
  };

  const report = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/contexts/${slug}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setReported(true);
    setReporting(false);
  };

  const btn = (active: boolean) =>
    `flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm tabular-nums transition-colors disabled:opacity-60 ${
      active ? "border-craie bg-craie text-nuit" : "border-trait text-brume hover:border-brume hover:text-craie"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => vote(1)} aria-pressed={state.mine === 1} className={btn(state.mine === 1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span className="sr-only">Ce contexte marche, </span>
        {state.up}
      </button>
      <button type="button" disabled={busy} onClick={() => vote(-1)} aria-pressed={state.mine === -1} className={btn(state.mine === -1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
        <span className="sr-only">Ce contexte ne marche pas, </span>
        {state.down}
      </button>
      {reported ? (
        <span className="px-2 text-sm text-tampon">Signalement envoyé à la modération</span>
      ) : reporting ? (
        <form onSubmit={report} className="flex w-full flex-wrap gap-2 pt-2 sm:w-auto sm:pt-0">
          <label htmlFor="raison" className="sr-only">
            Raison du signalement
          </label>
          <input
            id="raison"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Endpoint changé, champ manquant…"
            className="min-w-0 flex-1 rounded-full border border-trait bg-nuit px-3.5 py-1.5 text-sm outline-none focus:border-safran sm:w-64"
          />
          <button type="submit" className="rounded-full bg-craie px-3.5 py-1.5 text-sm font-semibold text-nuit">
            Signaler
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setReporting(true)} className="px-2 text-sm text-voile hover:text-craie">
          Signaler une erreur
        </button>
      )}
    </div>
  );
}
