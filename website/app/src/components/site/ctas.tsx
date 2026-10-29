/**
 * Calls to action. Every one is a rounded liquid glass drop (see ./glass):
 * full pills, and a circle for the closing seal. Two tones share one
 * material:
 * - primary, glass tinted Rastgar red (hero quote, the seal's core);
 * - clear, cool glass over a dimmed backdrop (everything else).
 * Each keeps its own small rounded detail: a glass bead with an arrow, a
 * pulsing red dot, a phone glyph.
 *
 * Quote CTAs and the catalog link route inside this site (/quote, /catalog).
 * Explore scrolls to the products section; documentation is a mailto and the
 * call button a tel link.
 */
import { Link } from "@tanstack/react-router";
import { useId, useRef } from "react";

import { CONTACT, FOUNDED, docsHref } from "./content";
import { GlassFx, useLiquidGlass } from "./glass/liquid-glass";

import "./ctas.css";

function ArrowGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5.5 12h12.5M12.5 6.5 18 12l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/** Nav: compact clear glass pill; the red dot pulses once on hover. */
export function NavQuote() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <Link className="lg lg--clear cta-nav" ref={ref} to="/quote">
      <GlassFx />
      <span aria-hidden="true" className="cta-nav__dot" />
      <span>Request a quote</span>
    </Link>
  );
}

/** Hero: red glass pill, magnetic, with the arrow riding in a round glass bead. */
export function HeroQuote() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref, { magnetic: 0.2 });
  return (
    <Link className="lg lg--primary cta-hero" ref={ref} to="/quote">
      <GlassFx />
      <span className="cta-hero__label">Request a quote</span>
      <span aria-hidden="true" className="cta-bead cta-bead--hero">
        <ArrowGlyph />
      </span>
    </Link>
  );
}

/** Hero secondary: clear glass pill that scrolls to the product lines. */
export function HeroExplore() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <a className="lg lg--clear cta-explore" href="#products" ref={ref}>
      <GlassFx />
      <span>Explore products</span>
      <span aria-hidden="true" className="cta-bead cta-bead--sm cta-explore__bead">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 5.5v12.5M6.5 12.5 12 18l5.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </span>
    </a>
  );
}

/** Process: clear glass pill that opens an email asking for documentation. */
export function DocsRequest() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <a className="lg lg--clear cta-docs" href={docsHref} ref={ref}>
      <GlassFx />
      <span aria-hidden="true" className="cta-bead cta-bead--sm cta-docs__bead">
        <svg viewBox="0 0 24 24">
          <rect fill="none" height="13" rx="3" stroke="currentColor" strokeWidth="1.9" width="17" x="3.5" y="5.5" />
          <path
            d="m4.5 7.5 7.5 5.5 7.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
          />
        </svg>
      </span>
      <span>Request documentation</span>
    </a>
  );
}

/** Products footer: clear glass pill to the full catalog page on this site. */
export function CatalogLink() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <Link className="lg lg--clear cta-catalog" ref={ref} to="/catalog">
      <GlassFx />
      <span>Browse full catalog</span>
      <span aria-hidden="true" className="cta-bead cta-bead--sm cta-catalog__bead">
        <ArrowGlyph />
      </span>
    </Link>
  );
}

/**
 * Closing: a round glass seal. Its ring text turns while hovered, around a
 * red glass core; disc and core follow the pointer at different strengths.
 */
export function SealQuote() {
  const ref = useRef<HTMLAnchorElement>(null);
  const pathId = `seal-path-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  useLiquidGlass(ref, { magnetic: 0.3 });
  return (
    <Link aria-label="Request a quote" className="cta-seal" ref={ref} to="/quote">
      <span aria-hidden="true" className="lg lg--clear cta-seal__disc">
        <GlassFx />
      </span>
      <svg aria-hidden="true" className="cta-seal__ring" viewBox="0 0 200 200">
        <defs>
          <path d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" id={pathId} />
        </defs>
        {/* textLength fits the ring exactly (2 x pi x 78), so the turn is seamless. */}
        <text>
          <textPath href={`#${pathId}`} lengthAdjust="spacing" startOffset="0" textLength="489">
            {`REQUEST A QUOTE · SALES@RASTGAR.COM · SINCE ${FOUNDED} · `}
          </textPath>
        </text>
      </svg>
      <span aria-hidden="true" className="lg lg--primary cta-seal__core">
        <GlassFx />
        <ArrowGlyph />
      </span>
    </Link>
  );
}

/** Closing secondary: clear glass pill with a phone glyph in a bead. */
export function CallPlant() {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <a className="lg lg--clear cta-call" href={CONTACT.phoneHref} ref={ref}>
      <GlassFx />
      <span aria-hidden="true" className="cta-bead cta-call__bead">
        <svg viewBox="0 0 24 24">
          <path
            d="M8.2 3.8 6 4.4c-1.2.3-2 1.5-1.8 2.7.9 6 5.7 10.8 11.7 11.7 1.2.2 2.4-.6 2.7-1.8l.6-2.2c.2-.8-.2-1.6-1-1.9l-2.6-1.1c-.7-.3-1.5-.1-2 .5l-.9 1.1c-2-1-3.6-2.6-4.6-4.6l1.1-.9c.6-.5.8-1.3.5-2l-1.1-2.6c-.3-.8-1.1-1.2-1.9-1z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <span className="cta-call__text">
        <span className="cta-call__label">Call the plant</span>
        <span className="cta-call__number">{CONTACT.phoneDisplay}</span>
      </span>
    </a>
  );
}
