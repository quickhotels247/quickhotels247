import type { DestinationSuggestion } from "@quickhotels/types/hotels";

// Turns what a customer types into TripJack region names (upper case).
// "Delhi" → NEW DELHI, "Bangalore" → BENGALURU, "Mumbai, India" → MUMBAI.

// Old or common names → the names TripJack uses (checked against its region list).
const ALIASES: Record<string, string[]> = {
  DELHI: ["NEW DELHI"],
  BANGALORE: ["BENGALURU"],
  BOMBAY: ["MUMBAI"],
  MADRAS: ["CHENNAI"],
  CALCUTTA: ["KOLKATA"],
  COCHIN: ["KOCHI"],
  POONA: ["PUNE"],
  TRIVANDRUM: ["THIRUVANANTHAPURAM"],
  MYSORE: ["MYSURU"],
  PONDICHERRY: ["PUDUCHERRY"],
  GURGAON: ["GURUGRAM"],
  BENARES: ["VARANASI"],
  BANARAS: ["VARANASI"],
  ALLEPPEY: ["ALAPPUZHA"],
  KANYAKUMARI: ["KANNIYAKUMARI"],
  OOTY: ["OOTACAMUND"],
};

const clean = (text: string) => text.trim().replace(/\s+/g, " ").toUpperCase();

// TripJack names for old names starting with what was typed: "bangal" → BENGALURU.
export function aliasTargets(typed: string): string[] {
  const prefix = clean(typed);
  if (prefix.length < 3) return [];
  return Object.entries(ALIASES).flatMap(([alias, names]) => (alias.startsWith(prefix) ? names : []));
}

const SMALL_WORDS = new Set(["of", "and", "the", "de", "la", "le", "del", "da", "di", "du"]);

// "NEW DELHI" → "New Delhi"; "UNITED STATES OF AMERICA" → "United States of America".
export function titleCase(text: string) {
  return text
    .toLowerCase()
    .split(" ")
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : word.replace(/(^|[-(.'])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase())))
    .join(" ");
}

export function destinationNames(destination: string): string[] {
  const name = clean(destination.split(",")[0] ?? "");
  if (!name) return [];
  return [name, ...(ALIASES[name] ?? [])];
}

// "Paris, France" → "FRANCE"; null when only a place was typed.
export function destinationCountry(destination: string): string | null {
  const parts = destination.split(",");
  return parts.length > 1 ? clean(parts[parts.length - 1]!) || null : null;
}

export interface RegionCandidate {
  regionId: string;
  name: string;
  cityName: string;
  countryName: string;
  regionType: string;
  // Hotels TripJack lists there, when known. Decides between places that
  // share a name (Bali, Indonesia vs a village called Bali).
  hotelCount?: number | null;
}

// Most specific first: a city beats the area around it, which beats a state.
const TYPE_RANK: Record<string, number> = { CITY: 0, MULTI_CITY_VICINITY: 1, PROVINCE_STATE: 2 };

// Picks the best match: an exact region name (in the typed country, if one
// was given), then the place with the most hotels, then India (most of our
// customers), then the most specific region type.
export function pickRegion(candidates: RegionCandidate[], names: string[], country: string | null = null): RegionCandidate | null {
  const inCountry = country ? candidates.filter((region) => region.countryName === country) : candidates;
  const score = (region: RegionCandidate) => [
    names.includes(region.name) ? 0 : 1,
    -(region.hotelCount ?? 0),
    region.countryName === "INDIA" ? 0 : 1,
    TYPE_RANK[region.regionType] ?? 3,
  ];
  candidates = inCountry.length ? inCountry : candidates;
  const sorted = [...candidates].sort((a, b) => {
    const [x, y] = [score(a), score(b)];
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
    return 0;
  });
  return sorted[0] ?? null;
}

export interface RegionRow {
  regionId: string;
  name: string;
  countryName: string;
  regionType: string;
  fullName: string; // "HYDERABAD, TELANGANA, INDIA"
  hotelCount: number | null;
}

const KINDS: Record<string, DestinationSuggestion["kind"]> = { CITY: "city", MULTI_CITY_VICINITY: "area", PROVINCE_STATE: "region" };
const SPECIFIC: DestinationSuggestion["kind"][] = ["city", "area", "region"];

// Region rows (best first) → suggestions, one per place: TripJack often lists
// a city and the area around it under the same name. The merged entry keeps
// the most hotels and the most specific kind (a city over its area).
export function toSuggestions(rows: RegionRow[], limit: number): DestinationSuggestion[] {
  const byPlace = new Map<string, DestinationSuggestion>();
  for (const row of rows) {
    const key = `${row.name}|${row.countryName}`;
    const seen = byPlace.get(key);
    const kind = KINDS[row.regionType] ?? "region";
    if (seen) {
      if (row.hotelCount !== null && row.hotelCount > (seen.hotelCount ?? -1)) seen.hotelCount = row.hotelCount;
      if (SPECIFIC.indexOf(kind) < SPECIFIC.indexOf(seen.kind)) seen.kind = kind;
      continue;
    }
    if (byPlace.size === limit) continue;
    const name = titleCase(row.name);
    const country = titleCase(row.countryName);
    const detail = row.fullName.split(",").slice(1).map((part) => titleCase(part.trim())).filter(Boolean).join(", ");
    byPlace.set(key, {
      id: row.regionId,
      name,
      detail: detail || country,
      kind,
      query: `${name}, ${country}`,
      hotelCount: row.hotelCount,
    });
  }
  return [...byPlace.values()];
}
