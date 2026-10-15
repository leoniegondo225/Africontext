import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { SubmitStudio } from "@/components/submit-studio";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Publier un contexte" };
export const dynamic = "force-dynamic";

export default async function ContribuerPage() {
  const user = await getSession();
  const example = fs
    .readFileSync(path.join(process.cwd(), "content", "contexts", "wave-checkout-api.md"), "utf8")
    .replace("slug: wave-checkout-api", "slug: wave-checkout-api-exemple")
    .replace(/^status:.*\n|^author:.*\n|^github:.*\n|^sandbox:.*\n|^category:.*\n/gm, "");

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h1 className="text-title font-semibold display-narrow">Publier un contexte</h1>
      <p className="mt-4 max-w-[64ch] leading-relaxed text-brume">
        Le contexte doit suivre la Spec : un en-tête avec sa source officielle, puis huit sections. Le contrôle tourne pendant que vous
        écrivez. Une clé en clair bloque la publication. Chaque contexte reste en attente jusqu&apos;à la relecture d&apos;un administrateur.
      </p>
      <div className="mt-10">
        <SubmitStudio signedIn={Boolean(user)} example={example} />
      </div>
    </div>
  );
}
