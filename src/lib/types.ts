export type ContextType = "cursorrules" | "claude_prompt" | "mcp_server";
export type ContextStatus = "pending" | "approved" | "rejected" | "to_recheck";
export type Tool = "cursor" | "claude-code";
export type ExportTool = "cursor" | "claude-code" | "agents";
export type Category = "paiement" | "sms" | "outillage";

export type SpecSectionKey =
  | "auth"
  | "endpoints"
  | "errors"
  | "webhooks"
  | "idempotence"
  | "pitfalls"
  | "example"
  | "env";

export interface Proof {
  prompt: string;
  model: string;
  without: string;
  withContext: string;
  /** Passages de `without` inventés par le modèle. Surlignés en rouge. */
  inventions: { text: string; note: string }[];
  /** Passages de `withContext` conformes à la doc officielle. Surlignés en vert. */
  fixes: string[];
  withoutResult: string;
  withResult: string;
}

export interface ContextStats {
  up: number;
  down: number;
  copies: number;
  installs: number;
}

export interface AfriContext {
  slug: string;
  title: string;
  service: string;
  description: string;
  type: ContextType;
  category: Category;
  pays: string[];
  version_api: string;
  source_url: string;
  tested_with: Tool[];
  last_verified_at: string;
  tags: string[];
  status: ContextStatus;
  author: { name: string; github: string };
  sandbox?: "wave" | "orange-money" | "fedapay";
  sections: Record<SpecSectionKey, string>;
  body: string;
  stats: ContextStats;
  proof?: Proof;
}
