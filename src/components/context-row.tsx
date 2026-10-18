import Link from "next/link";
import type { AfriContext } from "@/lib/types";
import { countryName } from "@/lib/countries";
import { formatStampDate } from "./stamp";
import { ServiceLogo } from "./service-logo";

export const TYPE_LABEL: Record<AfriContext["type"], string> = {
  cursorrules: ".cursorrules",
  claude_prompt: "Prompt Claude",
  mcp_server: "Serveur MCP",
};

export const TOOL_LABEL: Record<string, string> = { cursor: "Cursor", "claude-code": "Claude Code" };

export function formatNumber(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/** Une ligne du registre du catalogue. */
export function ContextRow({ ctx }: { ctx: AfriContext }) {
  const recheck = ctx.status === "to_recheck";
  return (
    <li className="group relative border-b border-trait/70">
      <div className="grid gap-x-8 gap-y-3 py-6 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-3">
          <ServiceLogo service={ctx.service} size={44} />
          <div>
            <p className="display-narrow text-[1.9rem] font-semibold leading-none">{ctx.service}</p>
            <p className="mt-2 text-xs text-voile">{TYPE_LABEL[ctx.type]}</p>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-[1.05rem] font-medium">
            <Link href={`/contextes/${ctx.slug}`} className="after:absolute after:inset-0 hover:text-safran-2">
              {ctx.title}
            </Link>
          </h3>
          <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-brume">{ctx.description}</p>
          <p className="mt-3 flex flex-wrap gap-1.5">
            {ctx.pays.slice(0, 6).map((p) => (
              <span key={p} title={countryName(p)} className="rounded border border-trait px-1.5 py-0.5 text-[0.7rem] text-brume">
                {p}
              </span>
            ))}
            {ctx.pays.length > 6 ? <span className="px-1 text-[0.7rem] text-voile">+{ctx.pays.length - 6}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm md:justify-end">
          <div className="text-right">
            {recheck ? (
              <p className="font-medium text-erreur">À revérifier</p>
            ) : (
              <p className="font-medium text-tampon">Vérifié le {formatStampDate(ctx.last_verified_at)}</p>
            )}
            <p className="mt-0.5 text-xs text-voile">
              {ctx.tested_with.map((t) => TOOL_LABEL[t] ?? t).join(" et ")}
              {ctx.proof ? ", preuve avant / après" : ""}
            </p>
          </div>
          <div className="w-20 text-right tabular-nums">
            <p className="font-semibold">{formatNumber(ctx.stats.installs)}</p>
            <p className="text-xs text-voile">installations</p>
          </div>
        </div>
      </div>
    </li>
  );
}
