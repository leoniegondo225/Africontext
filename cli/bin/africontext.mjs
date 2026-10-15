#!/usr/bin/env node
// AfriContext CLI. No dependencies, Node 18+.
//   npx africontext add <slug> [--tool cursor|claude-code|agents] [--force]
//   npx africontext search <texte> [--pays SN]
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

// Set AFRICONTEXT_URL to the public Systalink URL once deployed.
const BASE = (process.env.AFRICONTEXT_URL || "http://localhost:3000").replace(/\/$/, "");
const FILES = { cursor: ".cursorrules", "claude-code": "CLAUDE.md", agents: "AGENTS.md" };

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function flag(args, name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

function detectTool() {
  if (existsSync(".cursor") || existsSync(".cursorrules")) return "cursor";
  if (existsSync("CLAUDE.md") || existsSync(".claude")) return "claude-code";
  return "cursor";
}

async function add(args) {
  const slug = args[0];
  if (!slug || slug.startsWith("--")) {
    console.error(c.red("Indiquez un slug : npx africontext add wave-checkout-api"));
    process.exit(1);
  }
  const tool = flag(args, "tool", detectTool());
  if (!FILES[tool]) {
    console.error(c.red(`Outil inconnu : ${tool}. Valeurs : ${Object.keys(FILES).join(", ")}`));
    process.exit(1);
  }

  const res = await fetch(`${BASE}/api/contexts/${encodeURIComponent(slug)}/raw?tool=${tool}`, {
    headers: { "x-africontext-cli": "0.1.0" },
  });
  if (res.status === 404) {
    console.error(c.red(`Contexte introuvable : ${slug}`) + c.dim(`\nCherchez-le : npx africontext search ${slug.split("-")[0]}`));
    process.exit(1);
  }
  if (!res.ok) {
    console.error(c.red(`Le serveur a répondu ${res.status}. Réessayez dans un instant.`));
    process.exit(1);
  }
  const content = await res.text();
  const file = resolve(process.cwd(), FILES[tool]);
  const marker = `AfriContext: ${slug}`;

  if (existsSync(file)) {
    const current = readFileSync(file, "utf8");
    if (current.includes(`npx africontext add ${slug}`) && !args.includes("--force")) {
      console.log(c.yellow(`${FILES[tool]} contient déjà ${slug}.`) + c.dim(" Ajoutez --force pour l'ajouter à nouveau."));
      return;
    }
    appendFileSync(file, `\n\n<!-- ${marker} -->\n${content}`);
  } else {
    writeFileSync(file, content);
  }

  console.log(`${c.green("✓")} ${c.bold(slug)} écrit dans ${c.bold(FILES[tool])}`);
  if (res.headers.get("x-africontext-status") === "to_recheck") {
    console.log(c.yellow("  Attention : la doc source a changé depuis la dernière vérification."));
  }
  console.log(c.dim(`  Fiche : ${BASE}/contextes/${slug}`));
}

async function search(args) {
  const q = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--pays").join(" ");
  const pays = flag(args, "pays", "");
  const url = new URL(`${BASE}/api/contexts`);
  if (q) url.searchParams.set("q", q);
  if (pays) url.searchParams.set("pays", pays);
  const res = await fetch(url);
  const { results } = await res.json();
  if (!results.length) {
    console.log(c.dim(`Aucun contexte pour « ${q} ». Publiez-le : ${BASE}/contribuer`));
    return;
  }
  for (const r of results) {
    const state = r.status === "to_recheck" ? c.yellow("à revérifier") : c.green(`vérifié ${r.last_verified_at}`);
    console.log(`${c.bold(r.slug.padEnd(28))} ${r.service.padEnd(18)} ${state}`);
  }
  console.log(c.dim(`\nInstaller : npx africontext add <slug>`));
}

const [cmd, ...rest] = process.argv.slice(2);
const commands = { add, search };
if (!commands[cmd]) {
  console.log(`${c.bold("africontext")} : contextes IA vérifiés pour les services africains

  npx africontext add <slug> [--tool cursor|claude-code|agents]
  npx africontext search <texte> [--pays SN]

  AFRICONTEXT_URL=${BASE}`);
  process.exit(cmd ? 1 : 0);
}
commands[cmd](rest).catch((e) => {
  console.error(c.red(`Erreur réseau : ${e.message}`));
  process.exit(1);
});
