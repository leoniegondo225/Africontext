"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { REQUIRED_FIELDS, SPEC_SECTIONS, validateSpec, type SpecReport } from "@/lib/spec";

type Result =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "published"; slug: string }
  | { kind: "blocked"; message: string; secret: boolean }
  | { kind: "error"; message: string };

function fakeKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 28; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return ["sk", "live", s].join("_");
}

export function SubmitStudio({ signedIn, example }: { signedIn: boolean; example: string }) {
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftSource, setDraftSource] = useState<"ia" | "squelette" | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });

  const report: SpecReport | null = useMemo(() => (raw.trim() ? validateSpec(raw) : null), [raw]);
  const fieldIssues = new Set(report?.issues.map((i) => i.field));
  const doneSections = report ? SPEC_SECTIONS.filter((s) => report.sections[s.key]).length : 0;
  const doneFields = report ? REQUIRED_FIELDS.filter((f) => !fieldIssues.has(f)).length : 0;

  const draft = async (e: React.FormEvent) => {
    e.preventDefault();
    setDraftError("");
    setDraftSource(null);
    setDrafting(true);
    const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const data = (await res.json().catch(() => ({ error: "Le serveur n'a pas répondu. Réessayez." }))) as {
      draft?: string;
      error?: string;
      source?: "ia" | "squelette";
    };
    setDrafting(false);
    if (data.draft) {
      setRaw(data.draft);
      setDraftSource(data.source ?? "squelette");
      setResult({ kind: "idle" });
    } else setDraftError(data.error ?? "Brouillon impossible");
  };

  const injectKey = () => {
    const key = fakeKey();
    setRaw((r) =>
      /## Authentification\r?\n\r?\n/.test(r)
        ? r.replace(/(## Authentification\r?\n\r?\n)/, `$1- Clé de test : ${key}\n`)
        : r + `\n- Clé de test : ${key}\n`,
    );
    setResult({ kind: "idle" });
  };

  const publish = async () => {
    setResult({ kind: "busy" });
    const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw }) });
    const data = (await res.json()) as { ok: boolean; slug?: string; message?: string; blocked?: string };
    if (data.ok && data.slug) setResult({ kind: "published", slug: data.slug });
    else if (data.blocked) setResult({ kind: "blocked", message: data.message ?? "", secret: data.blocked === "secret" });
    else setResult({ kind: "error", message: data.message ?? "Publication impossible" });
  };

  const secrets = report?.secrets ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <form onSubmit={draft} className="rounded-2xl border border-trait bg-nuit-2 p-5">
          <label htmlFor="doc-url" className="font-semibold">
            Partir de la documentation officielle
          </label>
          <p className="mt-1 text-sm text-brume">Collez son URL : un brouillon au format Spec apparaît dans l&apos;éditeur. Vous le complétez et le relisez.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              id="doc-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.wave.com/checkout"
              className="code h-11 min-w-0 flex-1 rounded-xl border border-trait bg-nuit px-3 outline-none focus:border-safran"
            />
            <button
              disabled={drafting || !signedIn}
              className="h-11 rounded-xl bg-craie px-4 text-sm font-semibold text-nuit disabled:cursor-not-allowed disabled:opacity-50"
            >
              {drafting ? "Lecture de la doc…" : "Générer le brouillon"}
            </button>
          </div>
          {!signedIn ? (
            <p className="mt-3 text-sm text-voile">
              <Link href="/connexion" className="text-safran-2 underline underline-offset-4">
                Connectez-vous
              </Link>{" "}
              pour générer un brouillon et publier.
            </p>
          ) : null}
          {drafting ? (
            <p className="mt-3 text-sm text-voile" role="status">
              Claude lit la documentation et remplit les huit sections. Comptez une trentaine de secondes.
            </p>
          ) : null}
          {draftSource === "ia" ? (
            <p className="mt-3 text-sm text-tampon" role="status">
              Brouillon rédigé par Claude depuis la doc. Relisez chaque section : tout « Non documenté » est à vérifier avant de publier.
            </p>
          ) : null}
          {draftSource === "squelette" ? (
            <p className="mt-3 text-sm text-safran-2" role="status">
              Squelette prêt : la rédaction par IA n&apos;est pas disponible pour le moment. Complétez chaque « À compléter ».
            </p>
          ) : null}
          {draftError ? <p className="mt-3 text-sm text-erreur">{draftError}</p> : null}
        </form>

        <div className="rounded-2xl border border-trait bg-nuit-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-trait px-4 py-3">
            <label htmlFor="editeur" className="mr-auto font-semibold">
              Contexte
            </label>
            <button type="button" onClick={() => setRaw(example)} className="rounded-full border border-trait px-3 py-1 text-xs text-brume hover:text-craie">
              Charger un exemple valide
            </button>
            <button
              type="button"
              onClick={injectKey}
              disabled={!raw}
              className="rounded-full border border-erreur/40 px-3 py-1 text-xs text-erreur hover:bg-erreur/10 disabled:opacity-40"
            >
              Insérer une fausse clé d&apos;API
            </button>
          </div>
          <textarea
            id="editeur"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (result.kind !== "busy") setResult({ kind: "idle" });
            }}
            spellCheck={false}
            placeholder={"---\nslug: mon-service-api\ntitle: …\n---\n\n## Authentification\n…"}
            className="code scroll-thin block h-[560px] w-full resize-y bg-transparent p-4 outline-none placeholder:text-voile"
          />
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-live="polite">
        <div className="rounded-2xl border border-trait p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Contrôle de la Spec</h2>
            <span className="text-sm tabular-nums text-voile">
              {doneFields + doneSections} / {REQUIRED_FIELDS.length + SPEC_SECTIONS.length}
            </span>
          </div>
          <p className="mt-4 text-sm text-voile">En-tête</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {REQUIRED_FIELDS.map((f) => {
              const ok = report && !fieldIssues.has(f);
              return (
                <li key={f} className={`code rounded px-1.5 py-0.5 text-[0.7rem] ${ok ? "bg-tampon/15 text-tampon" : "bg-nuit-3 text-voile"}`}>
                  {f}
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm text-voile">Sections</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {SPEC_SECTIONS.map((s) => {
              const ok = report?.sections[s.key];
              return (
                <li key={s.key} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-tampon" : "border border-voile"}`} aria-hidden="true" />
                  <span className={ok ? "text-craie" : "text-brume"}>{s.heading}</span>
                  <span className="sr-only">{ok ? "présente" : "manquante"}</span>
                </li>
              );
            })}
          </ul>
          {report?.issues.filter((i) => !SPEC_SECTIONS.some((s) => s.heading === i.field)).length ? (
            <ul className="mt-4 space-y-1 border-t border-trait pt-4 text-sm text-safran-2">
              {report.issues
                .filter((i) => !SPEC_SECTIONS.some((s) => s.heading === i.field))
                .map((i) => (
                  <li key={i.field + i.message}>
                    <code className="code">{i.field}</code> : {i.message}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>

        <div className={`rounded-2xl border p-5 ${secrets.length ? "border-erreur bg-erreur/10" : "border-trait"}`}>
          <h2 className="font-semibold">Scan des secrets</h2>
          {secrets.length ? (
            <>
              <p className="mt-2 text-sm text-[#ffb3aa]">
                {secrets.length} valeur{secrets.length > 1 ? "s" : ""} secrète{secrets.length > 1 ? "s" : ""} détectée{secrets.length > 1 ? "s" : ""}.
                Remplacez-la par le nom de sa variable d&apos;environnement.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {secrets.map((s, i) => (
                  <li key={i} className="rounded-lg bg-nuit/60 p-2.5">
                    <span className="text-craie">{s.rule}</span>
                    <span className="text-voile">, ligne {s.line}</span>
                    <code className="code mt-1 block truncate text-erreur">{s.excerpt}</code>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-brume">
              {raw ? "Aucune clé, aucun jeton, aucune clé privée détectés." : "Motifs surveillés : sk_, pk_, Bearer suivi d'un jeton, JWT, clés PEM, valeurs longues assignées à une clé."}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={publish}
          disabled={!raw || result.kind === "busy" || !signedIn}
          className="w-full rounded-full bg-safran px-5 py-3 font-semibold text-nuit transition-colors hover:bg-safran-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {result.kind === "busy" ? "Vérification…" : "Publier pour modération"}
        </button>

        {result.kind === "published" ? (
          <p className="rounded-xl border border-tampon/40 bg-tampon/10 p-4 text-sm text-[#b9f2d8]">
            Publié pour modération : <code className="code">{result.slug}</code> est en attente. Il apparaîtra dans le catalogue dès qu&apos;un
            administrateur l&apos;aura validé.
          </p>
        ) : result.kind === "blocked" ? (
          <p role="alert" className={`rounded-xl border p-4 text-sm ${result.secret ? "border-erreur bg-erreur/15 text-[#ffb3aa]" : "border-safran/40 bg-safran/10 text-safran-2"}`}>
            {result.message}
          </p>
        ) : result.kind === "error" ? (
          <p role="alert" className="rounded-xl border border-erreur/40 bg-erreur/10 p-4 text-sm text-[#ffb3aa]">
            {result.message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
