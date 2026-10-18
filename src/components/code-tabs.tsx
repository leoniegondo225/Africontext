"use client";

import { useSyncExternalStore } from "react";
import { CodeView } from "./code-view";

export const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  python: "Python",
  php: "PHP",
  cpp: "C++",
  json: "JSON",
};

const KEY = "africontext:lang";
const EVENT = "africontext:lang";
// Repli si le stockage du navigateur est bloqué : le choix tient au moins jusqu'au rechargement.
let memory: string | null = null;

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function read(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

/** Langage choisi par le visiteur, partagé par tous les blocs de la page et mémorisé entre les visites. */
export function useCodeLang(available: readonly string[]): [string, (lang: string) => void] {
  const saved = useSyncExternalStore(subscribe, read, () => null);
  const lang = saved && available.includes(saved) ? saved : available[0];
  const setLang = (next: string) => {
    memory = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  return [lang, setLang];
}

export function LangTabs({ langs, value, onChange }: { langs: readonly string[]; value: string; onChange: (lang: string) => void }) {
  return (
    <div role="tablist" aria-label="Langage" className="flex gap-1 rounded-full border border-trait bg-nuit p-1 text-xs">
      {langs.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={value === l}
          onClick={() => onChange(l)}
          className={`rounded-full px-3 py-1 transition-colors ${value === l ? "bg-craie text-nuit" : "text-brume hover:text-craie"}`}
        >
          {LANG_LABELS[l] ?? l}
        </button>
      ))}
    </div>
  );
}

/** Le même exemple écrit dans plusieurs langages, un onglet par langage. */
export function CodeTabs({ blocks }: { blocks: { lang: string; code: string }[] }) {
  const langs = blocks.map((b) => b.lang);
  const [lang, setLang] = useCodeLang(langs);
  const current = blocks.find((b) => b.lang === lang) ?? blocks[0];
  return (
    <div className="rounded-xl border border-trait bg-nuit">
      <div className="flex border-b border-trait px-2 py-2 sm:px-3">
        <LangTabs langs={langs} value={lang} onChange={setLang} />
      </div>
      <div className="px-2 py-3 sm:px-3" role="tabpanel">
        <CodeView key={lang} code={current.code} />
      </div>
    </div>
  );
}
