import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { publicContexts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Catalogue" };
export const dynamic = "force-dynamic";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pays?: string; categorie?: string }>;
}) {
  const sp = await searchParams;
  const contexts = publicContexts();
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="text-title font-semibold display-narrow">Catalogue</h1>
      <p className="mt-4 max-w-[60ch] leading-relaxed text-brume">
        Chaque contexte cite sa documentation source, sa version d&apos;API et la date de sa dernière vérification. Ceux marqués à revérifier
        ont vu leur doc source changer depuis.
      </p>
      <div className="mt-8">
        <CatalogExplorer contexts={contexts} initial={{ q: sp.q ?? "", pays: sp.pays ?? "", category: sp.categorie ?? "" }} />
      </div>
    </div>
  );
}
