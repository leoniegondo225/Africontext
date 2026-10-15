import { useId } from "react";

type Tone = "tampon" | "erreur" | "safran";

const TONES: Record<Tone, string> = {
  tampon: "var(--color-tampon)",
  erreur: "var(--color-erreur)",
  safran: "var(--color-safran)",
};

/**
 * Un tampon encreur, l'image de la vérification sur papier en Afrique francophone :
 * un anneau de texte, une date au centre, une encre un peu irrégulière.
 */
export function Stamp({
  ring,
  center,
  sub,
  tone = "tampon",
  size = 132,
  rotate = -14,
  animate = false,
  className = "",
}: {
  ring: string;
  center: string;
  sub?: string;
  tone?: Tone;
  size?: number;
  rotate?: number;
  animate?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const color = TONES[tone];
  const ringText = (ring + " • ").repeat(3);
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`${ring}, ${center}${sub ? ", " + sub : ""}`}
      className={`${animate ? "stamp-land" : ""} ${className}`}
      style={{ ["--r" as string]: `${rotate}deg`, transform: `rotate(${rotate}deg)`, color }}
    >
      <defs>
        <filter id={`ink-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3.2" />
        </filter>
        <path id={`ring-${id}`} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <g filter={`url(#ink-${id})`} fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="94" strokeWidth="5" />
        <circle cx="100" cy="100" r="58" strokeWidth="2" />
        <text
          fill="currentColor"
          stroke="none"
          fontFamily="var(--font-mono)"
          fontSize="13.5"
          fontWeight="700"
          letterSpacing="2.6"
        >
          <textPath href={`#ring-${id}`} textLength="460" lengthAdjust="spacing">
            {ringText.slice(0, 64)}
          </textPath>
        </text>
        <text
          x="100"
          y={sub ? 104 : 110}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontFamily="var(--font-sans)"
          fontWeight="700"
          fontSize={center.length > 8 ? 22 : 28}
          style={{ fontStretch: "75%" }}
        >
          {center}
        </text>
        {sub ? (
          <text x="100" y="128" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5">
            {sub}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

export function formatStampDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y?.slice(2)}`;
}
