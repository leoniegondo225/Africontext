import type { Metadata } from "next";
import { SandboxConsole } from "@/components/sandbox-console";

export const metadata: Metadata = { title: "Sandboxes" };

const SERVICES = ["wave", "orange-money", "fedapay"] as const;

export default async function SandboxPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const initial = SERVICES.find((s) => s === service) ?? "wave";
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="text-title font-semibold display-narrow">Sandboxes</h1>
      <p className="mt-4 max-w-[64ch] leading-relaxed text-brume">
        Des faux serveurs Wave, Orange Money et FedaPay qui répondent comme les vrais. Le code généré avec un contexte passe. Le code
        inventé reçoit une erreur qui dit quoi corriger. Chaque paiement réussi renvoie le webhook signé que le service enverrait.
      </p>
      <div className="mt-10">
        <SandboxConsole initial={initial} />
      </div>
    </div>
  );
}
