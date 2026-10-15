import type { Metadata } from "next";
import Link from "next/link";
import { AdminBoard } from "@/components/admin-board";
import { getSession } from "@/lib/auth";
import { allContexts } from "@/lib/catalog";
import { SPEC_SECTIONS, scanSecrets } from "@/lib/spec";
import { store } from "@/lib/store";

export const metadata: Metadata = { title: "Modération" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSession();
  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 pt-20">
        <h1 className="text-title font-semibold display-narrow">Modération</h1>
        <p className="mt-4 leading-relaxed text-brume">Cet espace est réservé aux administrateurs.</p>
        <Link href="/connexion" className="mt-8 inline-block rounded-full bg-safran px-5 py-2.5 text-sm font-semibold text-nuit">
          Se connecter
        </Link>
      </div>
    );
  }

  const list = allContexts();
  const queue = list
    .filter((c) => c.status === "pending")
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      service: c.service,
      author: c.author.github || c.author.name,
      source_url: c.source_url,
      type: c.type,
      sectionsOk: SPEC_SECTIONS.filter((s) => c.sections[s.key]?.trim()).length,
      sectionsTotal: SPEC_SECTIONS.length,
      secrets: scanSecrets(c.body).length,
    }));
  const watched = list
    .filter((c) => c.status === "approved" || c.status === "to_recheck")
    .map((c) => ({ slug: c.slug, title: c.title, status: c.status, last_verified_at: c.last_verified_at }));

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="text-title font-semibold display-narrow">Modération</h1>
      <p className="mt-4 max-w-[60ch] leading-relaxed text-brume">
        Rien n&apos;est publié sans relecture. Vérifiez la source officielle, puis approuvez ou rejetez.
      </p>
      <div className="mt-12">
        <AdminBoard queue={queue} watched={watched} reports={store().reports} />
      </div>
    </div>
  );
}
