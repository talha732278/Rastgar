/**
 * Catalog data and search. Pure functions only (no browser APIs), so the
 * default view filters and renders on the server exactly as on the client.
 */
import rawData from "./catalog-data.json";

export interface CatalogPart {
  part: string;
  oem: string;
  brand: string;
  type: string;
  category: string;
}

export const CATEGORIES = [
  { label: "Wheel hubs", short: "Wheel hub", slug: "wheel-hubs" },
  { label: "Hub assemblies", short: "Hub assembly", slug: "hub-assemblies" },
  { label: "Brake drums", short: "Brake drum", slug: "brake-drums" },
  { label: "Steering, brackets and flywheels", short: "Steering and brackets", slug: "steering" },
  { label: "Bearings", short: "Bearing", slug: "bearings" },
  { label: "Studs, ABS and small parts", short: "Small part", slug: "small-parts" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export interface CatalogSearch {
  q?: string;
  category?: CategorySlug;
  brand?: string;
}

export interface PartRender {
  src: string;
  /** What the render shows, for alt text ("Illustrative render of a ..."). */
  label: string;
}

export interface IndexedPart extends CatalogPart {
  id: number;
  slug: CategorySlug;
  short: string;
  /** False when the part type already names the category ("Wheel Hub" in Wheel hubs). */
  showTag: boolean;
  render: PartRender | null;
  nPart: string;
  nOem: string;
  nBrand: string;
  /** Normalized searchable fields, joined with a separator the query can never contain. */
  hay: string;
}

/** Lowercase and drop everything but letters and digits, so "R 23.01", "r-23-01" and "r2301" are one key. */
export const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const RENDERS = {
  assembly: { label: "hub assembly", src: "/assets/products/trailer-hub.webp" },
  drive: { label: "wheel hub", src: "/assets/products/drive-axle-hub.webp" },
  drum: { label: "hub and brake drum assembly", src: "/assets/products/hub-drum-assembly.webp" },
  exploded: { label: "hub assembly taken apart to show its bearings", src: "/assets/products/preadjusted-assembly.webp" },
  smallParts: { label: "hub with studs and ABS ring", src: "/assets/products/trailer-hub.webp" },
  steer: { label: "steering axle hub", src: "/assets/products/steering-axle-hub.webp" },
} satisfies Record<string, PartRender>;

/** A representative render for the product family. Never the exact part. */
function renderFor(row: CatalogPart): PartRender | null {
  const type = row.type.toLowerCase();
  if (type.includes("enduraset")) return RENDERS.exploded;
  if (type.includes("hub drum") || type.includes("brake drum")) return RENDERS.drum;
  switch (row.category) {
    case "Wheel hubs":
      return RENDERS.drive;
    case "Hub assemblies":
      return type.includes("front") ? RENDERS.steer : RENDERS.assembly;
    case "Brake drums":
      return RENDERS.drum;
    case "Bearings":
      return RENDERS.exploded;
    case "Studs, ABS and small parts":
      return RENDERS.smallParts;
    case "Steering, brackets and flywheels":
      return type.includes("knuckle") || type.includes("hub") ? RENDERS.steer : null;
    default:
      return null;
  }
}

const bySlug = new Map<string, (typeof CATEGORIES)[number]>(CATEGORIES.map((c) => [c.slug, c]));
const byLabel = new Map<string, (typeof CATEGORIES)[number]>(CATEGORIES.map((c) => [c.label, c]));

export const PARTS: IndexedPart[] = (rawData as CatalogPart[]).map((row, id) => {
  const category = byLabel.get(row.category) ?? CATEGORIES[0];
  const nPart = normalize(row.part);
  const nOem = normalize(row.oem);
  const nBrand = normalize(row.brand);
  return {
    ...row,
    hay: [nPart, nOem, nBrand, normalize(row.type), normalize(row.category)].join("|"),
    id,
    nBrand,
    nOem,
    nPart,
    render: renderFor(row),
    short: category.short,
    showTag: !normalize(row.type).includes(normalize(category.short)),
    slug: category.slug,
  };
});

/** Groupings in the brand column that are not vehicle or axle makers. */
const NOT_A_BRAND = new Set(["OTHER", "RASTGAR", "SPECIAL APPLICATION", "TRAILER HUBS", "UTILITY TRAILER HUBS"]);

const brandNames = Array.from(new Set(PARTS.map((p) => p.brand))).sort((a, b) =>
  a.localeCompare(b, "en", { sensitivity: "base" })
);
const brandByKey = new Map(brandNames.map((b) => [normalize(b), b]));

export const CATALOG_STATS = {
  brands: brandNames.filter((b) => !NOT_A_BRAND.has(b.toUpperCase())).length,
  categories: new Set(PARTS.map((p) => p.category)).size,
  parts: PARTS.length,
};

export const categoryBySlug = (slug?: string) => (slug ? bySlug.get(slug) : undefined);

/** Router validateSearch: coerce whatever is in the URL into a clean CatalogSearch. */
export function parseCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const text = (value: unknown) =>
    typeof value === "string" ? value : typeof value === "number" ? String(value) : undefined;
  const out: CatalogSearch = {};
  const q = text(input.q)?.slice(0, 80);
  if (q && q.trim()) out.q = q;
  const category = text(input.category);
  if (category && bySlug.has(category)) out.category = category as CategorySlug;
  const brand = text(input.brand);
  const canonical = brand ? brandByKey.get(normalize(brand)) : undefined;
  if (canonical) out.brand = canonical;
  return out;
}

/* --------------------------------------------------------------- search */

interface Query {
  whole: string;
  tokens: string[];
  /**
   * "whole": the query, run together, appears in some part ("R 23.01" is
   * "r2301"). "tokens": it does not, so every word must match somewhere
   * ("volvo rear hub").
   */
  mode: "whole" | "tokens";
}

export function parseQuery(raw: string): Query {
  const whole = normalize(raw);
  const words = raw.split(/\s+/).map(normalize).filter(Boolean);
  // Single letters ("r" in "r 2301") would match nearly everything on their own.
  const long = words.filter((word) => word.length > 1);
  const tokens = long.length > 0 ? long : words;
  const mode = !whole || PARTS.some((row) => row.hay.includes(whole)) ? "whole" : "tokens";
  return { mode, tokens, whole };
}

function matches(row: IndexedPart, query: Query) {
  if (!query.whole) return true;
  if (query.mode === "whole") return row.hay.includes(query.whole);
  return query.tokens.every((token) => row.hay.includes(token));
}

/** Lower is better: exact part or OEM number, then a prefix, then brand, then anything else. */
function rank(row: IndexedPart, whole: string) {
  if (row.nPart === whole || row.nOem === whole) return 0;
  if (row.nPart.startsWith(whole) || row.nOem.startsWith(whole)) return 1;
  if (row.nBrand === whole) return 2;
  if (row.nPart.includes(whole) || row.nOem.includes(whole)) return 3;
  return 4;
}

export interface SearchResult {
  rows: IndexedPart[];
  /** Matches per category under the current query and brand. */
  categoryCounts: Record<CategorySlug, number>;
  /** Matches across all categories under the current query and brand. */
  categoryTotal: number;
  /** Matches per brand under the current query and category. */
  brandCounts: Map<string, number>;
  brandTotal: number;
}

export function searchCatalog(rawQuery: string, category?: CategorySlug, brand?: string): SearchResult {
  const query = parseQuery(rawQuery);
  const categoryCounts = Object.fromEntries(CATEGORIES.map((c) => [c.slug, 0])) as Record<CategorySlug, number>;
  const brandCounts = new Map<string, number>(brandNames.map((b) => [b, 0]));
  const rows: IndexedPart[] = [];
  let categoryTotal = 0;
  let brandTotal = 0;

  for (const row of PARTS) {
    if (!matches(row, query)) continue;
    const brandOk = !brand || row.brand === brand;
    const categoryOk = !category || row.slug === category;
    if (brandOk) {
      categoryCounts[row.slug] += 1;
      categoryTotal += 1;
    }
    if (categoryOk) {
      brandCounts.set(row.brand, (brandCounts.get(row.brand) ?? 0) + 1);
      brandTotal += 1;
    }
    if (brandOk && categoryOk) rows.push(row);
  }

  if (query.whole) {
    const scored = rows.map((row) => ({ row, score: rank(row, query.whole) }));
    scored.sort((a, b) => a.score - b.score || a.row.id - b.row.id);
    rows.splice(0, rows.length, ...scored.map((s) => s.row));
  }

  return { brandCounts, brandTotal, categoryCounts, categoryTotal, rows };
}

export const BRANDS = brandNames;

/**
 * Where the query sits inside a display string, ignoring case, spaces, dots
 * and dashes, mapped back to the original characters. Tries the whole query,
 * then the longest single token.
 */
export function matchRange(text: string, query: Query): [number, number] | null {
  if (!query.whole) return null;
  let norm = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i].toLowerCase();
    if (/[a-z0-9]/.test(ch)) {
      norm += ch;
      map.push(i);
    }
  }
  const candidates =
    query.mode === "whole" ? [query.whole] : [...query.tokens].sort((a, b) => b.length - a.length);
  for (const needle of candidates) {
    const at = norm.indexOf(needle);
    if (at >= 0) return [map[at], map[at + needle.length - 1] + 1];
  }
  return null;
}
