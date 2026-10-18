/** Logos des services de paiement, servis depuis public/logos. */
const LOGOS: Record<string, { src: string; bg: string; fit: "cover" | "contain" }> = {
  Wave: { src: "/logos/wave.jpg", bg: "#1DC4FF", fit: "cover" },
  "Orange Money": { src: "/logos/orange-money.png", bg: "#000000", fit: "cover" },
  "MTN MoMo": { src: "/logos/mtn-momo.webp", bg: "#FFCB05", fit: "contain" },
  FedaPay: { src: "/logos/fedapay.png", bg: "#FFFFFF", fit: "cover" },
  Paystack: { src: "/logos/paystack.png", bg: "#011B33", fit: "cover" },
  "M-Pesa": { src: "/logos/mpesa.png", bg: "#E60000", fit: "cover" },
};

export function hasServiceLogo(service: string) {
  return service in LOGOS;
}

/** Vignette carrée du logo d'un service. Ne rend rien si le service n'a pas de logo. */
export function ServiceLogo({ service, size = 40, className = "" }: { service: string; size?: number; className?: string }) {
  const logo = LOGOS[service];
  if (!logo) return null;
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-lg border border-trait ${className}`}
      style={{ width: size, height: size, background: logo.bg }}
    >
      <img
        src={logo.src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`h-full w-full ${logo.fit === "cover" ? "object-cover" : "object-contain"}`}
      />
    </span>
  );
}
