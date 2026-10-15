"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeView } from "./code-view";
import { CopyCommand } from "./copy-command";

type ServiceId = "wave" | "orange-money" | "fedapay";

interface Preset {
  label: string;
  invented?: boolean;
  method: "POST" | "GET";
  path: string;
  headers: Record<string, string>;
  body: string;
}

const PRESETS: Record<ServiceId, { name: string; presets: Preset[] }> = {
  wave: {
    name: "Wave",
    presets: [
      {
        label: "Créer une session Checkout",
        method: "POST",
        path: "v1/checkout/sessions",
        headers: { Authorization: "Bearer {{WAVE_API_KEY}}", "Content-Type": "application/json", "Idempotency-Key": "{{uuid}}" },
        body: JSON.stringify(
          { amount: "1000", currency: "XOF", client_reference: "commande-42", success_url: "https://boutique.sn/paiement/succes", error_url: "https://boutique.sn/paiement/erreur" },
          null,
          2,
        ),
      },
      {
        label: "Code inventé par l'IA",
        invented: true,
        method: "POST",
        path: "v1/pay",
        headers: { "X-API-KEY": "{{WAVE_API_KEY}}", "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: "+221770000000", amount: "1000.00", currency: "FCFA" }, null, 2),
      },
    ],
  },
  "orange-money": {
    name: "Orange Money",
    presets: [
      {
        label: "1. Obtenir le jeton OAuth",
        method: "POST",
        path: "oauth/v3/token",
        headers: { Authorization: "Basic {{base64(client_id:client_secret)}}", "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      },
      {
        label: "2. Initier le paiement web",
        method: "POST",
        path: "orange-money-webpay/dev/v1/webpayment",
        headers: { Authorization: "Bearer {{access_token}}", "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            merchant_key: "{{ORANGE_MERCHANT_KEY}}",
            currency: "OUV",
            order_id: "commande-42",
            amount: 5000,
            return_url: "https://boutique.sn/retour",
            cancel_url: "https://boutique.sn/annule",
            notif_url: "https://boutique.sn/api/webhooks/orange",
            lang: "fr",
            reference: "Boutique",
          },
          null,
          2,
        ),
      },
      {
        label: "Code inventé par l'IA",
        invented: true,
        method: "POST",
        path: "oauth/v2/token",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: "{{ORANGE_CLIENT_ID}}", client_secret: "{{ORANGE_CLIENT_SECRET}}" }, null, 2),
      },
    ],
  },
  fedapay: {
    name: "FedaPay",
    presets: [
      {
        label: "1. Créer la transaction",
        method: "POST",
        path: "v1/transactions",
        headers: { Authorization: "Bearer {{FEDAPAY_SECRET_KEY}}", "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Commande 42", amount: 2500, currency: { iso: "XOF" }, callback_url: "https://boutique.bj/retour" }, null, 2),
      },
      {
        label: "2. Générer le lien de paiement",
        method: "POST",
        path: "v1/transactions/{{transaction_id}}/token",
        headers: { Authorization: "Bearer {{FEDAPAY_SECRET_KEY}}" },
        body: "",
      },
      {
        label: "Code inventé par l'IA",
        invented: true,
        method: "POST",
        path: "v1/payments",
        headers: { Authorization: "Bearer {{FEDAPAY_SECRET_KEY}}", "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 250000, currency: "XOF" }, null, 2),
      },
    ],
  },
};

interface Exchange {
  status: number;
  ms: number;
  body: string;
  webhook?: { event: string; headers: Record<string, string>; body: string };
}

export function SandboxConsole({ initial }: { initial: ServiceId }) {
  const [service, setService] = useState<ServiceId>(initial);
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[service].presets[presetIdx];
  const [path, setPath] = useState(preset.path);
  const [headers, setHeaders] = useState(JSON.stringify(preset.headers, null, 2));
  const [body, setBody] = useState(preset.body);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const load = (s: ServiceId, i: number) => {
    const p = PRESETS[s].presets[i];
    setService(s);
    setPresetIdx(i);
    setPath(p.path);
    setHeaders(JSON.stringify(p.headers, null, 2));
    setBody(p.body);
    setExchange(null);
    setError("");
  };

  const fill = (s: string) =>
    s.replace(/\{\{([^}]+)\}\}/g, (_, k: string) => {
      if (k === "uuid") return crypto.randomUUID();
      if (vars[k]) return vars[k];
      if (k.startsWith("base64(")) return btoa("client-sandbox:secret-sandbox");
      return "sandbox";
    });

  const send = async () => {
    setError("");
    let h: Record<string, string>;
    try {
      h = JSON.parse(fill(headers));
    } catch {
      setError("Les headers doivent être un objet JSON valide.");
      return;
    }
    setBusy(true);
    const t0 = performance.now();
    const res = await fetch(`/api/sandbox/${service}/${fill(path)}`, { method: preset.method, headers: h, body: body ? fill(body) : undefined });
    const text = await res.text();
    const ms = Math.round(performance.now() - t0);
    const wh = res.headers.get("X-Sandbox-Webhook");
    let pretty = text;
    try {
      const parsed = JSON.parse(text);
      pretty = JSON.stringify(parsed, null, 2);
      if (parsed.access_token) setVars((v) => ({ ...v, access_token: parsed.access_token }));
      if (parsed["v1/transaction"]?.id) setVars((v) => ({ ...v, transaction_id: String(parsed["v1/transaction"].id) }));
    } catch {}
    setExchange({ status: res.status, ms, body: pretty, webhook: wh ? JSON.parse(atob(wh)) : undefined });
    setBusy(false);
  };

  const ok = exchange && exchange.status < 300;
  const base = `${origin}/api/sandbox/${service}`;
  const webhookPretty = useMemo(() => {
    if (!exchange?.webhook) return "";
    try {
      return JSON.stringify(JSON.parse(exchange.webhook.body), null, 2);
    } catch {
      return exchange.webhook.body;
    }
  }, [exchange]);

  return (
    <div>
      <div role="tablist" aria-label="Service" className="flex flex-wrap gap-2">
        {(Object.keys(PRESETS) as ServiceId[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={service === s}
            onClick={() => load(s, 0)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${service === s ? "border-craie bg-craie text-nuit" : "border-trait text-brume hover:text-craie"}`}
          >
            {PRESETS[s].name}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl">
        <p className="text-sm text-brume">Pointez votre code sur cette URL de base pour le tester sans toucher la vraie API :</p>
        <CopyCommand className="mt-2" text={base} prefix="" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-label="Requête" className="rounded-2xl border border-trait bg-nuit-2">
          <div className="flex flex-wrap gap-1.5 border-b border-trait p-3">
            {PRESETS[service].presets.map((p, i) => (
              <button
                key={p.label}
                onClick={() => load(service, i)}
                aria-pressed={presetIdx === i}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  presetIdx === i ? (p.invented ? "bg-erreur/15 text-[#ffb3aa]" : "bg-nuit-3 text-craie") : p.invented ? "text-erreur/80 hover:text-erreur" : "text-brume hover:text-craie"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <span className="code rounded-md bg-safran/15 px-2 py-1.5 font-semibold text-safran">{preset.method}</span>
              <label htmlFor="sb-path" className="sr-only">
                Chemin
              </label>
              <div className="code flex min-w-0 flex-1 items-center rounded-lg border border-trait bg-nuit px-2">
                <span className="hidden shrink-0 text-voile sm:inline">/{service}/</span>
                <input id="sb-path" value={path} onChange={(e) => setPath(e.target.value)} className="h-9 min-w-0 flex-1 bg-transparent outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="sb-headers" className="text-sm text-voile">
                Headers
              </label>
              <textarea
                id="sb-headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                spellCheck={false}
                rows={5}
                className="code scroll-thin mt-1 block w-full resize-y rounded-lg border border-trait bg-nuit p-3 outline-none focus:border-safran"
              />
            </div>
            <div>
              <label htmlFor="sb-body" className="text-sm text-voile">
                Corps
              </label>
              <textarea
                id="sb-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                rows={10}
                className="code scroll-thin mt-1 block w-full resize-y rounded-lg border border-trait bg-nuit p-3 outline-none focus:border-safran"
              />
            </div>
            <p className="text-xs text-voile">
              Les valeurs entre doubles accolades sont remplies par la sandbox. Le jeton et l&apos;identifiant de transaction obtenus sont réutilisés
              à l&apos;étape suivante.
            </p>
            {error ? <p className="text-sm text-erreur">{error}</p> : null}
            <button
              onClick={send}
              disabled={busy}
              className="w-full rounded-full bg-safran px-5 py-2.5 font-semibold text-nuit hover:bg-safran-2 disabled:opacity-60"
            >
              {busy ? "Envoi…" : "Envoyer la requête"}
            </button>
          </div>
        </section>

        <section aria-label="Réponse" aria-live="polite" className="min-w-0 space-y-6">
          {exchange ? (
            <>
              <div className="rounded-2xl border border-trait bg-nuit-2">
                <div className="flex items-center gap-3 border-b border-trait px-4 py-3">
                  <span className={`code rounded-md px-2 py-0.5 font-semibold ${ok ? "bg-tampon/15 text-tampon" : "bg-erreur/15 text-erreur"}`}>
                    {exchange.status}
                  </span>
                  <span className="text-sm text-brume">{ok ? "Requête conforme à la documentation" : "Requête refusée"}</span>
                  <span className="ml-auto text-xs tabular-nums text-voile">{exchange.ms} ms</span>
                </div>
                <div className="max-h-[360px] overflow-auto p-3 scroll-thin">
                  <CodeView code={exchange.body} lineNumbers={false} />
                </div>
              </div>
              {exchange.webhook ? (
                <div className="rounded-2xl border border-tampon/40 bg-tampon/[0.05]">
                  <div className="border-b border-tampon/30 px-4 py-3">
                    <p className="font-semibold text-tampon">Webhook de test : {exchange.webhook.event}</p>
                    <p className="mt-0.5 text-sm text-brume">Ce que votre endpoint de notification recevrait. Secret de la sandbox : africontext-sandbox.</p>
                  </div>
                  <div className="space-y-1 border-b border-tampon/20 px-4 py-3">
                    {Object.entries(exchange.webhook.headers).map(([k, v]) => (
                      <p key={k} className="code truncate">
                        <span className="text-voile">{k}:</span> {v}
                      </p>
                    ))}
                  </div>
                  <div className="max-h-[260px] overflow-auto p-3 scroll-thin">
                    <CodeView code={webhookPretty} lineNumbers={false} />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col justify-center rounded-2xl border border-dashed border-trait p-8">
              <p className="text-xl font-semibold">Envoyez une requête pour voir la réponse.</p>
              <p className="mt-2 max-w-[44ch] text-brume">
                Essayez aussi « Code inventé par l&apos;IA » : la sandbox refuse l&apos;endpoint et explique quoi utiliser à la place.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
