/**
 * The on-site full catalog: hero with live counts, smart search, category
 * chips, a searchable brand filter and a paged grid of part cards.
 *
 * The URL holds the query, category and brand (see the route's
 * validateSearch), so every filtered view is shareable and the default view
 * renders on the server. Typing is debounced before it touches the URL.
 * Motion is transform-only and starts only after the visitor changes a filter.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  MagnifyingGlass,
  Wrench,
  X,
} from "@phosphor-icons/react/dist/ssr";

import { GlassFx, useLiquidGlass } from "@/components/site/glass/liquid-glass";
import { HeroQuote } from "@/components/site/ctas";
import { CONTACT, quoteHref } from "@/components/site/content";

import { BrandCombobox } from "./brand-combobox";
import {
  BRANDS,
  CATALOG_STATS,
  CATEGORIES,
  categoryBySlug,
  matchRange,
  parseQuery,
  searchCatalog,
} from "./catalog-model";
import type { CatalogSearch, CategorySlug, IndexedPart } from "./catalog-model";

import "./catalog.css";

const PAGE = 48;
const TYPE_DEBOUNCE_MS = 180;

interface CatalogPageProps {
  search: CatalogSearch;
  onSearch: (next: CatalogSearch) => void;
}

/** Client-side navigation for plain hrefs, keeping new-tab and modified clicks native. */
function useSoftLink() {
  const navigate = useNavigate();
  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = event.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      event.preventDefault();
      void navigate({ href });
    },
    [navigate]
  );
}

export function CatalogPage({ search, onSearch }: CatalogPageProps) {
  const searchRef = useRef(search);
  searchRef.current = search;

  /* ---------------------------------------------------------- query state */
  const urlQuery = search.q ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [applied, setApplied] = useState(urlQuery);
  const pushed = useRef(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const [motion, setMotion] = useState(false);

  // URL changed from outside (nav link, back button): follow it.
  useEffect(() => {
    if (urlQuery === pushed.current) return;
    pushed.current = urlQuery;
    setQuery(urlQuery);
    setApplied(urlQuery);
  }, [urlQuery]);

  // Typing: apply and write to the URL once the visitor pauses.
  useEffect(() => {
    if (query === applied) return;
    const timer = window.setTimeout(() => {
      setApplied(query);
      const trimmed = query.trim();
      if (trimmed === (searchRef.current.q ?? "")) return;
      pushed.current = trimmed;
      onSearch({ ...searchRef.current, q: trimmed || undefined });
    }, TYPE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [applied, onSearch, query]);

  // "/" jumps to the search field from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -------------------------------------------------------------- results */
  const { category, brand } = search;
  const result = useMemo(() => searchCatalog(applied, category, brand), [applied, category, brand]);
  const parsedQuery = useMemo(() => parseQuery(applied), [applied]);
  const filterKey = `${applied.trim()}|${category ?? ""}|${brand ?? ""}`;

  const [paging, setPaging] = useState({ key: filterKey, limit: PAGE });
  const limit = paging.key === filterKey ? paging.limit : PAGE;
  const shown = result.rows.slice(0, limit);
  const total = result.rows.length;
  const filtered = Boolean(applied.trim() || category || brand);

  const gridRef = useRef<HTMLUListElement>(null);
  const focusFrom = useRef<number | null>(null);
  useEffect(() => {
    const index = focusFrom.current;
    if (index == null) return;
    focusFrom.current = null;
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({ preventScroll: true });
  }, [limit]);

  const showMore = () => {
    setMotion(true);
    focusFrom.current = limit;
    setPaging({ key: filterKey, limit: limit + PAGE });
  };

  /* -------------------------------------------------------- announcements */
  const categoryLabel = categoryBySlug(category)?.label;
  const summary = describe(total, applied.trim(), categoryLabel, brand);
  const [announced, setAnnounced] = useState("");
  const firstSummary = useRef(true);
  useEffect(() => {
    if (firstSummary.current) {
      firstSummary.current = false;
      return;
    }
    const timer = window.setTimeout(() => setAnnounced(summary), 450);
    return () => window.clearTimeout(timer);
  }, [summary]);

  const [copyNote, setCopyNote] = useState("");
  const onCopied = useCallback((part: string) => setCopyNote(`Copied part number ${part}`), []);

  /* ------------------------------------------------------------- handlers */
  const setCategory = (slug?: CategorySlug) => {
    setMotion(true);
    onSearch({ ...searchRef.current, category: slug });
  };
  const setBrand = (next?: string) => {
    setMotion(true);
    onSearch({ ...searchRef.current, brand: next });
  };
  const clearAll = () => {
    setMotion(true);
    pushed.current = "";
    setQuery("");
    setApplied("");
    onSearch({});
    inputRef.current?.focus();
  };
  const clearQuery = () => {
    setMotion(true);
    setQuery("");
    inputRef.current?.focus();
  };

  const softLink = useSoftLink();

  return (
    <>
      <section aria-labelledby="catalog-title" className="cat-hero">
        <div className="shell cat-hero__inner">
          <header className="section-head cat-hero__head">
            <h1 className="section-title section-title--xl" id="catalog-title">
              The full catalog
            </h1>
            <p className="section-lede">
              Every Rastgar part with its OEM cross reference. Search by part number, OEM number, brand or type.
            </p>
          </header>
          <dl className="cat-stats">
            <div className="cat-stat">
              <dt>Parts listed</dt>
              <dd>{CATALOG_STATS.parts}</dd>
            </div>
            <div className="cat-stat">
              <dt>Brands covered</dt>
              <dd>{CATALOG_STATS.brands}</dd>
            </div>
            <div className="cat-stat">
              <dt>Categories</dt>
              <dd>{CATALOG_STATS.categories}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="finder-title" className="cat-finder">
        <div className="shell">
          <h2 className="sr-only" id="finder-title">
            Search the catalog
          </h2>

          <div className="cat-panel">
            <div className="cat-field cat-field--search">
              <label className="cat-label" htmlFor="catalog-q">
                Search the catalog
              </label>
              <div className="cat-search">
                <MagnifyingGlass aria-hidden="true" className="cat-search__icon" size={24} weight="bold" />
                <input
                  aria-describedby="catalog-q-hint"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="cat-search__input"
                  enterKeyHint="search"
                  id="catalog-q"
                  onChange={(event) => {
                    setMotion(true);
                    setQuery(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && query) {
                      event.preventDefault();
                      clearQuery();
                    }
                  }}
                  placeholder="R 23.01, 20499881 or Volvo"
                  ref={inputRef}
                  spellCheck={false}
                  type="search"
                  value={query}
                />
                {query ? (
                  <GlassButton className="cat-search__clear" label="Clear search" onClick={clearQuery}>
                    <X aria-hidden="true" size={18} weight="bold" />
                  </GlassButton>
                ) : (
                  <kbd aria-hidden="true" className="cat-search__kbd">
                    /
                  </kbd>
                )}
              </div>
              <p className="cat-hint" id="catalog-q-hint">
                Matches Rastgar part numbers, OEM numbers, brands and part types. Spaces, dots and dashes are ignored.
              </p>
            </div>

            <div className="cat-field">
              <span className="cat-label" id="catalog-category-label">
                Category
              </span>
              <div aria-labelledby="catalog-category-label" className="cat-chips" role="group">
                <CategoryChip
                  count={result.categoryTotal}
                  label="All"
                  onClick={() => setCategory(undefined)}
                  pressed={!category}
                />
                {CATEGORIES.map((c) => (
                  <CategoryChip
                    count={result.categoryCounts[c.slug]}
                    key={c.slug}
                    label={c.label}
                    onClick={() => setCategory(category === c.slug ? undefined : c.slug)}
                    pressed={category === c.slug}
                  />
                ))}
              </div>
            </div>

            <div className="cat-panel__foot">
              <BrandCombobox
                brands={BRANDS}
                counts={result.brandCounts}
                onChange={setBrand}
                total={result.brandTotal}
                value={brand}
              />
              <div className="cat-panel__status">
                <p className="cat-count">
                  <strong>{total}</strong> {total === 1 ? "part" : "parts"}
                  {filtered ? <span> match</span> : null}
                </p>
                {filtered ? (
                  <GlassButton className="cat-clear" onClick={clearAll}>
                    <X aria-hidden="true" size={14} weight="bold" />
                    <span>Clear filters</span>
                  </GlassButton>
                ) : null}
              </div>
            </div>
          </div>

          <p aria-atomic="true" aria-live="polite" className="sr-only">
            {announced}
          </p>
          <p aria-atomic="true" aria-live="polite" className="sr-only">
            {copyNote}
          </p>

          {total === 0 ? (
            <EmptyState onClear={clearAll} onNavigate={softLink} query={applied.trim()} />
          ) : (
            <>
              <ul
                aria-label={`Catalog results, ${summary}`}
                className="cat-grid"
                data-motion={motion ? "on" : "off"}
                key={filterKey}
                ref={gridRef}
              >
                {shown.map((row, index) => (
                  <PartCard
                    index={index}
                    key={row.id}
                    onCopied={onCopied}
                    onNavigate={softLink}
                    query={parsedQuery}
                    row={row}
                    stagger={Math.min(index % PAGE, 14)}
                  />
                ))}
              </ul>
              <div className="cat-more">
                <p className="cat-more__label">
                  Showing {shown.length} of {total}
                </p>
                <span aria-hidden="true" className="cat-more__track">
                  <span className="cat-more__fill" style={{ transform: `scaleX(${shown.length / total})` }} />
                </span>
                {shown.length < total ? (
                  <GlassButton className="cat-more__btn" onClick={showMore}>
                    <span>Show {Math.min(PAGE, total - shown.length)} more</span>
                    <span aria-hidden="true" className="cat-bead">
                      <ArrowDown size={18} weight="bold" />
                    </span>
                  </GlassButton>
                ) : null}
                <p className="cat-more__note">Renders show the product family, not the exact part.</p>
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="catalog-oem-title" className="cat-oem">
        <div className="shell">
          <div className="cat-oem__panel">
            <img
              alt=""
              aria-hidden="true"
              className="cat-oem__art"
              decoding="async"
              height={900}
              loading="lazy"
              src="/assets/hub/blueprint.webp"
              width={1600}
            />
            <div className="cat-oem__copy">
              <p className="eyebrow">OEM programs</p>
              <h2 className="section-title" id="catalog-oem-title">
                Not in the list? We can make it.
              </h2>
              <p className="section-lede">
                Send a drawing, a sample or an OEM number. We engineer wheel-end parts to your drawing and supply them to
                program schedules.
              </p>
              <div className="cat-oem__actions">
                <HeroQuote />
                <a className="cat-oem__mail" href={`mailto:${CONTACT.salesEmail}`}>
                  {CONTACT.salesEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function describe(total: number, query: string, category?: string, brand?: string) {
  const parts = `${total} ${total === 1 ? "part" : "parts"}`;
  const scope = [category, brand].filter(Boolean).join(", ");
  if (query && scope) return `${parts} match "${query}" in ${scope}`;
  if (query) return `${parts} match "${query}"`;
  if (scope) return `${parts} in ${scope}`;
  return `${parts} in the catalog`;
}

/* ------------------------------------------------------ glass controls */

type Tone = "clear" | "primary";

/** A liquid glass button in the site's shared material (see site/glass). */
function GlassButton({
  children,
  className,
  label,
  onClick,
  tone = "clear",
}: {
  children: ReactNode;
  className: string;
  label?: string;
  onClick: () => void;
  tone?: Tone;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useLiquidGlass(ref);
  return (
    <button aria-label={label} className={`lg lg--${tone} ${className}`} onClick={onClick} ref={ref} type="button">
      <GlassFx />
      {children}
    </button>
  );
}

/** A liquid glass link; routes inside the site without a full reload. */
function GlassAnchor({
  children,
  className,
  href,
  label,
  onClick,
  tone = "clear",
}: {
  children: ReactNode;
  className: string;
  href: string;
  label?: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  tone?: Tone;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <a aria-label={label} className={`lg lg--${tone} ${className}`} href={href} onClick={onClick} ref={ref}>
      <GlassFx />
      {children}
    </a>
  );
}

/* ------------------------------------------------------------- chip */

function CategoryChip({
  count,
  label,
  onClick,
  pressed,
}: {
  count: number;
  label: string;
  onClick: () => void;
  pressed: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useLiquidGlass(ref);
  return (
    <button
      aria-pressed={pressed}
      className={`lg ${pressed ? "lg--primary" : "lg--clear"} cat-chip`}
      data-empty={count === 0}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <GlassFx />
      <span>{label}</span>
      <span className="cat-chip__count">{count}</span>
    </button>
  );
}

/* ------------------------------------------------------------- card */

function Highlight({ text, query }: { text: string; query: ReturnType<typeof parseQuery> }) {
  const range = matchRange(text, query);
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function PartCard({
  index,
  onCopied,
  onNavigate,
  query,
  row,
  stagger,
}: {
  index: number;
  onCopied: (part: string) => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
  query: ReturnType<typeof parseQuery>;
  row: IndexedPart;
  stagger: number;
}) {
  const titleId = `part-${row.id}`;
  return (
    <li className="cat-cell" style={{ "--i": stagger } as CSSProperties}>
      <article aria-labelledby={titleId} className="cat-card" data-index={index} tabIndex={-1}>
        <div className="cat-card__head">
          <p className="cat-card__brand">
            <Highlight query={query} text={row.brand} />
          </p>
          <p className="cat-card__type">{row.type}</p>
          {row.showTag ? <p className="cat-card__tag">{row.short}</p> : null}
        </div>
        <div aria-hidden={row.render ? undefined : true} className="cat-card__visual">
          {row.render ? (
            <img
              alt={`Illustrative render of a ${row.render.label}, not the exact part`}
              decoding="async"
              height={720}
              loading="lazy"
              src={row.render.src}
              width={960}
            />
          ) : (
            <Wrench size={34} weight="light" />
          )}
        </div>
        <dl className="cat-card__ids">
          <div className="cat-card__id cat-card__id--part">
            <dt>Rastgar no.</dt>
            <dd>
              <span className="cat-card__part" id={titleId}>
                <Highlight query={query} text={row.part} />
              </span>
              <CopyButton onCopied={onCopied} value={row.part} />
            </dd>
          </div>
          <div className="cat-card__id">
            <dt>OEM no.</dt>
            <dd className="cat-card__oem">
              <Highlight query={query} text={row.oem} />
            </dd>
          </div>
        </dl>
        <GlassAnchor
          className="cat-card__quote"
          href={quoteHref(undefined, row.part)}
          label={`Request a quote for ${row.part}`}
          onClick={onNavigate}
        >
          <span>Request a quote</span>
          <span aria-hidden="true" className="cat-bead cat-bead--sm">
            <ArrowRight size={15} weight="bold" />
          </span>
        </GlassAnchor>
      </article>
    </li>
  );
}

/* ------------------------------------------------------------- copy */

async function writeClipboard(value: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function CopyButton({ value, onCopied }: { value: string; onCopied: (part: string) => void }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await writeClipboard(value);
    setState(ok ? "copied" : "failed");
    if (ok) onCopied(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1600);
  };

  const tip = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy part no.";
  return (
    <span className="cat-copy-wrap" data-state={state}>
      <GlassButton
        className="cat-copy"
        label={`Copy part no. ${value}`}
        onClick={() => void copy()}
        tone={state === "copied" ? "primary" : "clear"}
      >
        {state === "copied" ? <Check aria-hidden="true" size={16} weight="bold" /> : <Copy aria-hidden="true" size={16} />}
      </GlassButton>
      <span aria-hidden="true" className="cat-copy__tip">
        {tip}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------- empty */

function EmptyState({
  onClear,
  onNavigate,
  query,
}: {
  onClear: () => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
  query: string;
}) {
  const href = query ? quoteHref(undefined, query) : quoteHref();
  return (
    <div className="cat-empty">
      <span aria-hidden="true" className="cat-empty__icon">
        <MagnifyingGlass size={30} weight="light" />
      </span>
      <h3 className="cat-empty__title">{query ? <>No parts match &ldquo;{query}&rdquo;</> : <>No parts match these filters</>}</h3>
      <p className="cat-empty__body">
        Check the number for typos or clear a filter. We also make wheel-end parts to drawing, so a missing number is
        still worth asking about.
      </p>
      <div className="cat-empty__actions">
        <GlassAnchor className="cat-empty__link" href={href} onClick={onNavigate} tone="primary">
          <span>Can&rsquo;t find your part? Send us the OEM number</span>
          <span aria-hidden="true" className="cat-bead cat-bead--sm cat-bead--red">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </GlassAnchor>
        <GlassButton className="cat-clear cat-clear--lg" onClick={onClear}>
          <X aria-hidden="true" size={14} weight="bold" />
          <span>Clear filters</span>
        </GlassButton>
      </div>
    </div>
  );
}

