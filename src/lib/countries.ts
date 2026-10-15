export const COUNTRIES: Record<string, string> = {
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  ML: "Mali",
  BF: "Burkina Faso",
  GM: "Gambie",
  UG: "Ouganda",
  CM: "Cameroun",
  GN: "Guinée",
  MG: "Madagascar",
  BJ: "Bénin",
  TG: "Togo",
  NE: "Niger",
  GH: "Ghana",
  RW: "Rwanda",
  ZM: "Zambie",
  NG: "Nigeria",
  ZA: "Afrique du Sud",
  KE: "Kenya",
  TZ: "Tanzanie",
  MW: "Malawi",
  CD: "RD Congo",
};

export function countryName(code: string): string {
  return COUNTRIES[code] ?? code;
}

/** Met en minuscules, retire accents et apostrophes pour que « senegal » trouve « Sénégal ». */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, " ")
    .toLowerCase();
}
