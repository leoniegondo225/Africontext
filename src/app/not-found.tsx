import Link from "next/link";
import { Stamp } from "@/components/stamp";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-10 px-4 pt-24 sm:px-6 md:flex-row md:items-center">
      <Stamp ring="Endpoint inventé" center="404" sub="NOT FOUND" tone="erreur" size={180} rotate={-8} />
      <div>
        <h1 className="text-title font-semibold display-narrow">Cette page n&apos;existe pas.</h1>
        <p className="mt-4 max-w-[48ch] leading-relaxed text-brume">
          Comme /v1/pay chez Wave. Le contexte que vous cherchez a peut-être changé de slug : cherchez-le dans le catalogue.
        </p>
        <Link href="/contextes" className="mt-8 inline-block rounded-full bg-safran px-5 py-2.5 text-sm font-semibold text-nuit hover:bg-safran-2">
          Chercher dans le catalogue
        </Link>
      </div>
    </div>
  );
}
