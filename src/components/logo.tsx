import Link from "next/link";

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--color-safran)" strokeWidth="2" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--color-craie)" strokeWidth="2" strokeDasharray="3 2.4" />
      <circle cx="16" cy="16" r="3" fill="var(--color-tampon)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-md" aria-label="AfriContext, accueil">
      <LogoMark />
      <span className="text-[1.15rem] font-semibold tracking-[-0.02em]">
        Afri<span className="text-brume transition-colors group-hover:text-craie">Context</span>
      </span>
    </Link>
  );
}
