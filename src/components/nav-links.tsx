"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/contextes", label: "Catalogue" },
  { href: "/sandbox", label: "Sandboxes" },
  { href: "/spec", label: "La Spec" },
  { href: "/impact", label: "Impact" },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Modération" }] : LINKS;

  const item = (l: { href: string; label: string }) => {
    const active = pathname === l.href || pathname.startsWith(l.href + "/");
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={`relative rounded-md px-3 py-2 text-sm transition-colors ${active ? "text-craie" : "text-brume hover:text-craie"}`}
      >
        {l.label}
        {active ? <span className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-safran" /> : null}
      </Link>
    );
  };

  return (
    <>
      <nav aria-label="Principale" className="hidden items-center md:flex">
        {links.map(item)}
      </nav>
      <button
        type="button"
        className="order-last rounded-md p-2 text-brume md:hidden"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">Menu</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
        </svg>
      </button>
      {open ? (
        <nav id="menu-mobile" aria-label="Principale" className="absolute inset-x-0 top-16 flex flex-col border-b border-trait bg-nuit px-2 py-3 md:hidden">
          {links.map(item)}
          <Link href="/connexion" className="rounded-md px-3 py-2 text-sm text-brume">
            Se connecter
          </Link>
        </nav>
      ) : null}
    </>
  );
}
