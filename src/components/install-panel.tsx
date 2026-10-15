"use client";

import { useState } from "react";
import type { ExportTool } from "@/lib/types";
import { CopyCommand } from "./copy-command";

const TOOLS: { id: ExportTool; label: string; file: string }[] = [
  { id: "cursor", label: "Cursor", file: ".cursorrules" },
  { id: "claude-code", label: "Claude Code", file: "CLAUDE.md" },
  { id: "agents", label: "Autres agents", file: "AGENTS.md" },
];

export function InstallPanel({ slug, isMcp }: { slug: string; isMcp: boolean }) {
  const [tool, setTool] = useState<ExportTool>("cursor");
  const [copied, setCopied] = useState<"idle" | "done">("idle");
  const current = TOOLS.find((t) => t.id === tool)!;
  const rawUrl = `/api/contexts/${slug}/raw?tool=${tool}`;

  const copyContent = async () => {
    const res = await fetch(rawUrl);
    await navigator.clipboard.writeText(await res.text());
    fetch(`/api/contexts/${slug}/events`, { method: "POST", body: JSON.stringify({ kind: "copy" }) }).catch(() => {});
    setCopied("done");
    setTimeout(() => setCopied("idle"), 1800);
  };

  return (
    <div className="rounded-2xl border border-trait bg-nuit-2 p-5">
      <h2 className="font-semibold">Installer dans votre projet</h2>
      <div role="tablist" aria-label="Outil" className="mt-4 flex gap-1 rounded-full border border-trait bg-nuit p-1 text-sm">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tool === t.id}
            onClick={() => setTool(t.id)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${tool === t.id ? "bg-craie text-nuit" : "text-brume hover:text-craie"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CopyCommand className="mt-4" text={`npx africontext add ${slug} --tool ${tool}`} slug={slug} kind="install" />
      <p className="mt-3 text-sm text-brume">
        Écrit <code className="code text-craie">{current.file}</code> à la racine du projet. Si le fichier existe, le contexte est ajouté à la fin.
      </p>
      {isMcp ? (
        <p className="mt-4 rounded-lg border border-safran/40 bg-safran/10 p-3 text-sm text-safran-2">
          Vérifiez l&apos;URL et la commande du serveur MCP avant de l&apos;installer. AfriContext l&apos;affiche mais ne l&apos;exécute jamais.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-trait pt-4 text-sm">
        <button type="button" onClick={copyContent} className="text-brume underline decoration-trait underline-offset-4 hover:text-craie">
          {copied === "done" ? "Contenu copié" : `Copier le contenu de ${current.file}`}
        </button>
        <a href={rawUrl} className="text-brume underline decoration-trait underline-offset-4 hover:text-craie">
          Endpoint brut
        </a>
      </div>
    </div>
  );
}
