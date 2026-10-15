import { countryName, fold } from "./countries";
import type { AfriContext } from "./types";

export interface SearchQuery {
  q?: string;
  pays?: string;
  category?: string;
  type?: string;
}

/** Recherche insensible aux accents sur le service, le titre, les tags et les noms de pays (« senegal » trouve SN). */
export function filterContexts<T extends AfriContext>(list: T[], { q, pays, category, type }: SearchQuery): T[] {
  const terms = fold(q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return list.filter((c) => {
    if (pays && !c.pays.includes(pays)) return false;
    if (category && c.category !== category) return false;
    if (type && c.type !== type) return false;
    if (!terms.length) return true;
    const hay = fold(
      [
        c.title,
        c.service,
        c.description,
        c.tags.join(" "),
        c.tags.join(" ").replace(/-/g, " "),
        c.pays.join(" "),
        c.pays.map(countryName).join(" "),
      ].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}
