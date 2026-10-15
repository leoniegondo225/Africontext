import type { ContextType, ExportTool, SpecSectionKey } from "./types";

/** Les huit sections que chaque contexte doit contenir, dans cet ordre. */
export const SPEC_SECTIONS: { key: SpecSectionKey; heading: string; hint: string }[] = [
  { key: "auth", heading: "Authentification", hint: "Méthode et en-têtes, sans aucune valeur secrète" },
  { key: "endpoints", heading: "Endpoints", hint: "Méthode, chemin, champs requis et optionnels" },
  { key: "errors", heading: "Erreurs", hint: "Codes de retour et comportement attendu" },
  { key: "webhooks", heading: "Webhooks", hint: "Format du payload et vérification de signature" },
  { key: "idempotence", heading: "Idempotence et limites", hint: "Clés d'idempotence et limites de débit" },
  { key: "pitfalls", heading: "Pièges courants", hint: "Ce que les LLMs inventent pour ce service" },
  { key: "example", heading: "Exemple minimal", hint: "Exemple complet et typé" },
  { key: "env", heading: "Variables d'environnement", hint: "Noms uniquement" },
];

export const REQUIRED_FIELDS = [
  "slug",
  "title",
  "type",
  "service",
  "pays",
  "version_api",
  "source_url",
  "tested_with",
  "last_verified_at",
  "tags",
] as const;

export const CONTEXT_TYPES: ContextType[] = ["cursorrules", "claude_prompt", "mcp_server"];

export type FrontMatter = Record<string, string | string[]>;

export function parseContextFile(raw: string): { meta: FrontMatter; body: string } {
  const text = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta: FrontMatter = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/i.exec(line.trim());
    if (!kv) continue;
    const value = kv[2].replace(/\s+#.*$/, "").trim();
    meta[kv[1]] = value.startsWith("[")
      ? value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : value;
  }
  return { meta, body: match[2].trim() };
}

export function splitSections(body: string): Partial<Record<SpecSectionKey, string>> {
  const out: Partial<Record<SpecSectionKey, string>> = {};
  const parts = body.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    const content = nl === -1 ? "" : part.slice(nl + 1).trim();
    const section = SPEC_SECTIONS.find((s) => heading.startsWith(s.heading.toLowerCase()));
    if (section) out[section.key] = content;
  }
  return out;
}

/* ---------- Détection de secrets ---------- */

export interface SecretFinding {
  rule: string;
  line: number;
  excerpt: string;
}

const SECRET_RULES: { rule: string; re: RegExp }[] = [
  { rule: "Clé secrète au format sk_", re: /\bsk_(?:live|test|sandbox)?_?[A-Za-z0-9]{16,}/g },
  { rule: "Clé publique au format pk_", re: /\bpk_(?:live|test|sandbox)_[A-Za-z0-9]{16,}/g },
  { rule: "Jeton Bearer en clair", re: /Bearer\s+(?![<{$"'+])[A-Za-z0-9\-._~+/]{20,}=*/g },
  { rule: "Clé secrète Flutterwave", re: /FLWSECK(?:_TEST)?-[A-Za-z0-9]{12,}/g },
  { rule: "Clé d'accès AWS", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { rule: "Jeton JWT", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { rule: "Clé privée PEM", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  {
    rule: "Valeur longue assignée à une clé",
    re: /\b(?:api[_-]?key|apikey|secret|token|password|passkey|private[_-]?key)\b["']?\s*[:=]\s*["'][A-Za-z0-9\-_/+=]{24,}["']/gi,
  },
];

export function scanSecrets(text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { rule, re } of SECRET_RULES) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line))) {
        const hit = m[0];
        const masked = hit.length > 10 ? hit.slice(0, 6) + "•".repeat(Math.min(hit.length - 8, 18)) + hit.slice(-2) : hit;
        findings.push({ rule, line: i + 1, excerpt: masked });
      }
    }
  });
  return findings;
}

/* ---------- Validation ---------- */

export interface SpecIssue {
  field: string;
  message: string;
}

export interface SpecReport {
  ok: boolean;
  issues: SpecIssue[];
  secrets: SecretFinding[];
  sections: Record<SpecSectionKey, boolean>;
  meta: FrontMatter;
}

export function validateSpec(raw: string): SpecReport {
  const { meta, body } = parseContextFile(raw);
  const issues: SpecIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    const v = meta[field];
    if (v === undefined || (Array.isArray(v) ? v.length === 0 : v.length === 0)) {
      issues.push({ field, message: "Champ obligatoire manquant dans l'en-tête" });
    }
  }
  if (typeof meta.slug === "string" && meta.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
    issues.push({ field: "slug", message: "Le slug n'accepte que minuscules, chiffres et tirets" });
  }
  if (typeof meta.type === "string" && meta.type && !CONTEXT_TYPES.includes(meta.type as ContextType)) {
    issues.push({ field: "type", message: "Le type doit être cursorrules, claude_prompt ou mcp_server" });
  }
  if (typeof meta.source_url === "string" && meta.source_url && !/^https:\/\/[^\s<>]+\.[^\s<>]+/.test(meta.source_url)) {
    issues.push({ field: "source_url", message: "La source doit être une URL HTTPS de la documentation officielle" });
  }
  if (typeof meta.last_verified_at === "string" && meta.last_verified_at && !/^\d{4}-\d{2}-\d{2}$/.test(meta.last_verified_at)) {
    issues.push({ field: "last_verified_at", message: "Date au format AAAA-MM-JJ" });
  }

  const found = splitSections(body);
  const sections = Object.fromEntries(
    SPEC_SECTIONS.map((s) => [s.key, Boolean(found[s.key] && found[s.key]!.length > 0)]),
  ) as Record<SpecSectionKey, boolean>;
  for (const s of SPEC_SECTIONS) {
    if (!sections[s.key]) issues.push({ field: s.heading, message: "Section « " + s.heading + " » absente ou vide" });
  }

  const secrets = scanSecrets(raw);
  return { ok: issues.length === 0 && secrets.length === 0, issues, secrets, sections, meta };
}

/* ---------- Export par outil ---------- */

export const EXPORT_FILES: Record<ExportTool, string> = {
  cursor: ".cursorrules",
  "claude-code": "CLAUDE.md",
  agents: "AGENTS.md",
};

export function exportFor(
  tool: ExportTool,
  ctx: { slug: string; title: string; source_url: string; version_api: string; last_verified_at: string; status: string; body: string },
): string {
  const warning =
    ctx.status === "to_recheck"
      ? "\n> Attention : la documentation source a changé depuis la dernière vérification. Vérifiez avant d'utiliser.\n"
      : "";
  const provenance = [
    "Source officielle : " + ctx.source_url,
    "Version d'API : " + ctx.version_api,
    "Dernière vérification : " + ctx.last_verified_at,
    "Installé avec : npx africontext add " + ctx.slug,
  ];
  if (tool === "cursor") {
    return [
      "# AfriContext: " + ctx.title,
      ...provenance.map((p) => "# " + p),
      warning,
      "Tu intègres " + ctx.title + ". Suis strictement les règles ci-dessous. N'invente aucun endpoint, champ ou header absent de ce fichier.",
      "",
      ctx.body,
      "",
    ].join("\n");
  }
  const heading = tool === "claude-code" ? "# " + ctx.title + " (contexte AfriContext)" : "# Instructions agent : " + ctx.title;
  return [
    heading,
    "",
    ...provenance.map((p) => "- " + p),
    warning,
    "Utilise uniquement les endpoints, champs et headers décrits ici. Si une information manque, dis-le au lieu de l'inventer.",
    "",
    ctx.body,
    "",
  ].join("\n");
}
