"use client";

import { useEffect, useRef, useState } from "react";

/** Coordonnées approximatives des capitales économiques (longitude, latitude). */
const COORDS: Record<string, [number, number]> = {
  SN: [-17.45, 14.7],
  CI: [-4.0, 5.35],
  ML: [-8.0, 12.65],
  BF: [-1.52, 12.37],
  GM: [-16.58, 13.45],
  UG: [32.58, 0.35],
  CM: [9.7, 4.05],
  GN: [-13.7, 9.5],
  MG: [47.5, -18.9],
  BJ: [2.42, 6.37],
  TG: [1.22, 6.13],
  NE: [2.1, 13.5],
  GH: [-0.2, 5.6],
  RW: [30.06, -1.95],
  ZM: [28.28, -15.4],
  NG: [3.38, 6.52],
  ZA: [28.04, -26.2],
  KE: [36.82, -1.29],
  TZ: [39.28, -6.8],
  MW: [33.78, -13.96],
  CD: [15.3, -4.32],
};

/** Contour grossier du continent et de Madagascar, suffisant pour une trame de points. */
const AFRICA: [number, number][] = [
  [-17.5, 14.7], [-16.8, 19.5], [-17, 21], [-13, 27.5], [-9.8, 29.5], [-9.6, 32.5], [-6.8, 34], [-5.9, 35.8],
  [-2, 35.1], [3, 36.8], [10, 37.3], [11, 35], [10, 33.8], [15, 32.3], [19.8, 30.5], [20, 32], [25, 31.7],
  [29.9, 31.2], [32.3, 31.3], [34.2, 31.3], [32.5, 29.9], [35.5, 24], [37.2, 21], [38.5, 18], [39.7, 15.5],
  [43.2, 12.5], [44.5, 10.4], [51.2, 11.8], [49, 6], [46, 2], [42.5, -1], [40, -3.5], [39.2, -6.5],
  [40.4, -10.5], [40.5, -15], [35, -20], [35.5, -24], [32.6, -26], [32.4, -28.8], [30, -31.3], [25.6, -34],
  [20, -34.8], [18.4, -34], [17.9, -31.5], [16.5, -28.6], [15, -26.5], [14.4, -22.5], [11.8, -17.2],
  [13.5, -12], [12.3, -6], [9.3, -1], [9.5, 3.5], [9.7, 4], [8.5, 4.5], [6, 4.3], [3.4, 6.4], [1, 5.9],
  [-2, 4.8], [-4, 5.2], [-7.5, 4.4], [-9.5, 5.3], [-11.5, 6.9], [-13.2, 8.5], [-15, 10.8], [-16.7, 12.4],
];
const MADAGASCAR: [number, number][] = [
  [49.3, -12], [50.4, -15.5], [49.4, -17.5], [47.1, -24.9], [45.2, -25.5], [43.7, -23.5], [44.4, -20],
  [44, -17], [46.5, -15.5], [48, -13.5],
];

function inside(poly: [number, number][], lon: number, lat: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

type Dot = { lon: number; lat: number; land: boolean };

/** Trame de points répartie à peu près uniformément sur la sphère. */
function buildDots(): Dot[] {
  const dots: Dot[] = [];
  const step = 2.4;
  for (let lat = -84; lat <= 84; lat += step) {
    const n = Math.max(1, Math.round((360 / step) * Math.cos((lat * Math.PI) / 180)));
    for (let k = 0; k < n; k++) {
      const lon = -180 + (k * 360) / n;
      const land = inside(AFRICA, lon, lat) || inside(MADAGASCAR, lon, lat);
      // L'océan reste une trame clairsemée pour garder le continent lisible.
      if (land || (k + Math.round(lat / step)) % 3 === 0) dots.push({ lon, lat, land });
    }
  }
  return dots;
}

export type GlobePoint = { code: string; label: string; count: number };

const RAD = Math.PI / 180;

/**
 * Globe 3D centré sur l'Afrique : chaque pays couvert par un contexte s'allume, et un arc
 * relie les pays qui partagent un même service. Dessiné en canvas 2D, sans dépendance.
 */
export function AfricaGlobe({
  points,
  links = [],
  interactive = false,
  className = "",
  label,
}: {
  points: GlobePoint[];
  links?: [string, string][];
  interactive?: boolean;
  className?: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; p: GlobePoint } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const SAFRAN = color("--color-safran", "#f2a93b");
    const TAMPON = color("--color-tampon", "#62d6a4");
    const CRAIE = color("--color-craie", "#eceaf6");
    const TRAIT = color("--color-trait", "#343a85");

    const dots = buildDots();
    const pins = points.filter((p) => COORDS[p.code]).map((p) => ({ ...p, at: COORDS[p.code] }));
    const arcs = links.filter(([a, b]) => COORDS[a] && COORDS[b] && a !== b).map(([a, b]) => [COORDS[a], COORDS[b]] as const);
    const maxCount = Math.max(1, ...pins.map((p) => p.count));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Orientation de la caméra : longitude et latitude du centre visible.
    let lon0 = 18;
    let lat0 = 4;
    let drag: { x: number; y: number; lon: number; lat: number } | null = null;
    let idleSince = 0;
    let size = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    let screenPins: { x: number; y: number; p: GlobePoint }[] = [];

    function project(lon: number, lat: number, alt = 0) {
      const l = (lon - lon0) * RAD;
      const p = lat * RAD;
      const p0 = lat0 * RAD;
      const k = 1 + alt;
      return {
        x: k * Math.cos(p) * Math.sin(l),
        y: k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
        z: k * (Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)),
      };
    }

    /** Interpolation sur le grand cercle entre deux points, en coordonnées cartésiennes. */
    function slerp(a: readonly [number, number], b: readonly [number, number], t: number): [number, number] {
      const toV = ([lo, la]: readonly [number, number]) => [Math.cos(la * RAD) * Math.cos(lo * RAD), Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD)];
      const va = toV(a);
      const vb = toV(b);
      const d = Math.acos(Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])) || 1e-6;
      const sa = Math.sin((1 - t) * d) / Math.sin(d);
      const sb = Math.sin(t * d) / Math.sin(d);
      const v = [sa * va[0] + sb * vb[0], sa * va[1] + sb * vb[1], sa * va[2] + sb * vb[2]];
      return [Math.atan2(v[1], v[0]) / RAD, Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD];
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      size = Math.min(rect.width, rect.height);
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
    }

    function draw(now: number) {
      const t = (now - start) / 1000;
      if (!drag && !reduced && now - idleSince > 1800) {
        // Balancement lent autour du continent plutôt qu'une rotation complète.
        lon0 += (18 + 26 * Math.sin(t * 0.18) - lon0) * 0.02;
        lat0 += (4 + 6 * Math.sin(t * 0.11) - lat0) * 0.02;
      }

      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      const R = size * 0.42;
      const cx = w / 2;
      const cy = h / 2;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      // Halo et volume de la sphère
      const halo = ctx!.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
      halo.addColorStop(0, SAFRAN + "22");
      halo.addColorStop(1, SAFRAN + "00");
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, w, h);
      const body = ctx!.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#2b3180");
      body.addColorStop(1, "#14174200");
      ctx!.fillStyle = body;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = TRAIT;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Trame de points : la profondeur règle taille et opacité
      for (const d of dots) {
        const p = project(d.lon, d.lat);
        if (p.z <= 0) continue;
        const r = d.land ? 1.1 + p.z * 0.9 : 0.6 + p.z * 0.4;
        ctx!.globalAlpha = d.land ? 0.25 + p.z * 0.7 : 0.08 + p.z * 0.18;
        ctx!.fillStyle = d.land ? CRAIE : TRAIT;
        ctx!.beginPath();
        ctx!.arc(cx + p.x * R, cy - p.y * R, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Arcs : un même service partagé entre deux pays, avec une impulsion qui circule
      ctx!.lineWidth = 1.2;
      arcs.forEach(([a, b], i) => {
        const steps = 40;
        let prev: { x: number; y: number; z: number } | null = null;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const [lo, la] = slerp(a, b, u);
          const p = project(lo, la, 0.16 * Math.sin(Math.PI * u));
          if (prev && prev.z > 0 && p.z > 0) {
            ctx!.globalAlpha = 0.35 * Math.min(prev.z, p.z) + 0.1;
            ctx!.strokeStyle = SAFRAN;
            ctx!.beginPath();
            ctx!.moveTo(cx + prev.x * R, cy - prev.y * R);
            ctx!.lineTo(cx + p.x * R, cy - p.y * R);
            ctx!.stroke();
          }
          prev = p;
        }
        const u = reduced ? 0.5 : (t * 0.35 + i * 0.37) % 1;
        const [lo, la] = slerp(a, b, u);
        const p = project(lo, la, 0.16 * Math.sin(Math.PI * u));
        if (p.z > 0) {
          ctx!.globalAlpha = 0.95;
          ctx!.fillStyle = SAFRAN;
          ctx!.beginPath();
          ctx!.arc(cx + p.x * R, cy - p.y * R, 2.2, 0, Math.PI * 2);
          ctx!.fill();
        }
      });

      // Pays couverts : une épingle verte qui pulse, plus large si le pays a plus de contextes
      screenPins = [];
      pins.forEach((pin, i) => {
        const p = project(pin.at[0], pin.at[1]);
        if (p.z <= 0.05) return;
        const x = cx + p.x * R;
        const y = cy - p.y * R;
        const base = 2.6 + (pin.count / maxCount) * 3.4;
        const pulse = reduced ? 0 : (t * 0.8 + i * 0.13) % 1;
        ctx!.globalAlpha = (1 - pulse) * 0.7 * p.z;
        ctx!.strokeStyle = TAMPON;
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        ctx!.arc(x, y, base + pulse * 14, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.globalAlpha = 0.6 + 0.4 * p.z;
        ctx!.fillStyle = TAMPON;
        ctx!.beginPath();
        ctx!.arc(x, y, base, 0, Math.PI * 2);
        ctx!.fill();
        screenPins.push({ x, y, p: pin });
      });
      ctx!.globalAlpha = 1;

      if (!reduced && visible) raf = requestAnimationFrame(draw);
    }

    function loop() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    }

    resize();
    loop();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) loop();
    });
    ro.observe(canvas);
    // On n'anime que lorsque le globe est à l'écran.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    });
    io.observe(canvas);

    function local(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e: PointerEvent) {
      drag = { x: e.clientX, y: e.clientY, lon: lon0, lat: lat0 };
      canvas!.setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
      if (drag) {
        const k = 160 / size;
        lon0 = drag.lon - (e.clientX - drag.x) * k;
        lat0 = Math.max(-60, Math.min(60, drag.lat + (e.clientY - drag.y) * k));
        idleSince = performance.now();
        if (reduced) loop();
        return;
      }
      const m = local(e);
      const near = screenPins.find((s) => Math.hypot(s.x - m.x, s.y - m.y) < 12);
      setHover(near ? { x: near.x, y: near.y, p: near.p } : null);
    }
    function onUp() {
      drag = null;
      idleSince = performance.now();
    }
    function onLeave() {
      setHover(null);
    }
    if (interactive) {
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [points, links, interactive]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={`h-full w-full ${interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
      />
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-lg border border-trait bg-nuit-2 px-3 py-1.5 text-sm shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.p.label} · <span className="text-tampon">{hover.p.count} contexte{hover.p.count > 1 ? "s" : ""}</span>
        </div>
      ) : null}
    </div>
  );
}
