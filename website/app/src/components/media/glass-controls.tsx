/**
 * Liquid glass controls for the media and careers pages. They reuse the
 * site's shared glass material (site/glass: .lg, clear or red primary) and
 * its pointer behaviour, so every pill and round button on these pages
 * matches the home page calls to action. Layout lives in each page's CSS.
 */
import { useRef } from "react";
import type { ReactNode } from "react";

import { GlassFx, useLiquidGlass } from "@/components/site/glass/liquid-glass";

import "./glass-controls.css";

export type GlassTone = "clear" | "primary";

interface GlassLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
  tone?: GlassTone;
  label?: string;
  /** File name for a download link (same-origin assets only). */
  download?: string;
}

export function GlassLink({ children, className = "", href, tone = "clear", label, download }: GlassLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  useLiquidGlass(ref);
  return (
    <a aria-label={label} className={`lg lg--${tone} ${className}`} download={download} href={href} ref={ref}>
      <GlassFx />
      {children}
    </a>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  className?: string;
  onClick: () => void;
  tone?: GlassTone;
  label?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  id?: string;
}

export function GlassButton({
  children,
  className = "",
  onClick,
  tone = "clear",
  label,
  pressed,
  expanded,
  controls,
  id,
}: GlassButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useLiquidGlass(ref);
  return (
    <button
      aria-controls={controls}
      aria-expanded={expanded}
      aria-label={label}
      aria-pressed={pressed}
      className={`lg lg--${tone} ${className}`}
      id={id}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <GlassFx />
      {children}
    </button>
  );
}

/** A filter chip: clear glass at rest, red glass when selected. */
export function GlassChip({
  children,
  count,
  onClick,
  pressed,
  className = "",
}: {
  children: ReactNode;
  count?: number;
  onClick: () => void;
  pressed: boolean;
  className?: string;
}) {
  return (
    <GlassButton className={`gx-chip ${className}`} onClick={onClick} pressed={pressed} tone={pressed ? "primary" : "clear"}>
      <span>{children}</span>
      {count === undefined ? null : <span className="gx-chip__count">{count}</span>}
    </GlassButton>
  );
}
