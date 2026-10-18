import Anthropic from "@anthropic-ai/sdk";
import { draftFromUrl } from "./draft";
import { SPEC_SECTIONS } from "./spec";

/**
 * Brouillon assisté par IA (F11). Claude lit la documentation avec l'outil web_fetch,
 * exécuté chez Anthropic : notre serveur ne télécharge jamais l'URL (pas de SSRF).
 * La lecture est limitée au domaine de la doc collée.
 * Le résultat reste un brouillon : l'auteur le relit, le formulaire le valide, un admin l'approuve.
 */

const MODEL = "claude-opus-5-5";
const MAX_CONTINUATIONS = 4;

const SYSTEM = `Tu rédiges des contextes AfriContext : des fiches injectées dans Cursor ou Claude Code pour qu'une IA intègre une API africaine sans rien inventer.

Règles strictes :
- Lis la documentation officielle avec l'outil web_fetch avant d'écrire. Suis les liens utiles du même site (authentification, endpoints, webhooks, erreurs).
- N'écris que ce que la documentation dit. Si une information manque, écris « Non documenté : à vérifier » plutôt que de deviner. Un endpoint inventé est la pire erreur possible.
- Jamais de valeur secrète : ni clé, ni token, ni mot de passe, même d'exemple. Seulement des noms de variables d'environnement.
- Réponds uniquement avec le fichier Markdown complet, sans phrase avant ni après, sans bloc \`\`\` autour.
- Garde exactement l'en-tête (front matter) et les huit titres de section du squelette fourni, dans le même ordre : ${SPEC_SECTIONS.map((s) => s.heading).join(", ")}.
- Ajuste les champs de l'en-tête (title, pays, version_api, tags) d'après la doc. Garde source_url tel quel.
- La section « Exemple minimal » contient le même exemple complet en quatre blocs qui se suivent : TypeScript typé (\`\`\`ts), Python avec requests (\`\`\`python), PHP avec Guzzle (\`\`\`php), C++ avec cpr et nlohmann/json (\`\`\`cpp). La section « Pièges courants » liste ce qu'une IA inventerait sans la doc.
- Écris en français.`;

export function aiDraftEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Retire un éventuel texte autour du fichier : on garde depuis l'en-tête « --- / slug: ». */
function extractContextFile(text: string): string | null {
  const start = text.search(/^---\s*\nslug:/m);
  if (start === -1) return null;
  return text
    .slice(start)
    .replace(/\n```\s*$/, "")
    .trim() + "\n";
}

export async function draftWithClaude(url: URL): Promise<string> {
  const client = new Anthropic();
  const skeleton = draftFromUrl(url.toString());
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Documentation officielle : ${url.toString()}\n\nRemplis ce squelette au format AfriContext Spec à partir de cette documentation :\n\n${skeleton}`,
    },
  ];

  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    const message = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 32000,
        // Si Claude refuse pour une raison de sécurité, l'API relance la requête sur un modèle de repli.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 6, allowed_domains: [url.hostname] }],
        messages,
      })
      .finalMessage();

    // La boucle d'outils côté serveur peut s'interrompre : on renvoie le tour tel quel pour qu'elle reprenne.
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.stop_reason === "refusal") throw new Error("Claude a refusé de rédiger ce brouillon.");

    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const file = extractContextFile(text);
    if (!file) throw new Error("Réponse de Claude sans en-tête au format Spec.");
    return file;
  }
  throw new Error("La lecture de la documentation a pris trop d'étapes.");
}
