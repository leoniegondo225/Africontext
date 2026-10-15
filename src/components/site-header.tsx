import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-trait/60 bg-nuit/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <NavLinks isAdmin={user?.role === "admin"} />
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <Link href="/contribuer" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-brume hover:text-craie">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" width={28} height={28} className="rounded-full border border-trait" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tampon text-xs font-bold text-nuit" aria-hidden="true">
                  {user.login.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">{user.login}</span>
            </Link>
          ) : (
            <Link href="/connexion" className="hidden text-sm text-brume hover:text-craie sm:inline">
              Se connecter
            </Link>
          )}
          <Link
            href="/contribuer"
            className="rounded-full bg-safran px-4 py-2 text-sm font-semibold text-nuit transition-colors hover:bg-safran-2"
          >
            Publier un contexte
          </Link>
        </div>
      </div>
    </header>
  );
}
