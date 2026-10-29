/**
 * Glass buttons for the quote page. A local, CSS-first take on the site's
 * liquid glass pill (styles in quote.css, .qbtn): translucent tint, blurred
 * backdrop, a bright top rim and a soft sheen, plus a glint that follows the
 * pointer. Kept here so this page does not depend on the shared CTA module.
 */
import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MutableRefObject, ReactNode, Ref } from "react";

/** Moves the glint (--gx/--gy) with the pointer; static under reduced motion. */
function useGlint<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      host.style.setProperty("--gx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      host.style.setProperty("--gy", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    };
    const leave = () => {
      host.style.removeProperty("--gx");
      host.style.removeProperty("--gy");
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}

function useMergedRef<T>(inner: MutableRefObject<T | null>, outer: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      inner.current = node;
      if (typeof outer === "function") outer(node);
      else if (outer) (outer as MutableRefObject<T | null>).current = node;
    },
    [inner, outer]
  );
}

type Tone = "primary" | "clear";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  /** Leading glyph. */
  icon?: ReactNode;
  /** Trailing glyph carried in a round glass bead. */
  bead?: ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { tone = "clear", icon, bead, className, children, type = "button", ...rest },
  outer
) {
  const inner = useGlint<HTMLButtonElement>();
  const ref = useMergedRef(inner, outer);
  return (
    <button
      className={`qbtn qbtn--${tone}${bead ? " qbtn--bead" : ""}${className ? ` ${className}` : ""}`}
      ref={ref}
      type={type}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="qbtn__icon">
          {icon}
        </span>
      ) : null}
      <span className="qbtn__label">{children}</span>
      {bead ? (
        <span aria-hidden="true" className="qbtn__bead">
          {bead}
        </span>
      ) : null}
    </button>
  );
});

interface GlassLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function GlassLink({ tone = "clear", icon, className, children, ...rest }: GlassLinkProps) {
  const ref = useGlint<HTMLAnchorElement>();
  return (
    <a className={`qbtn qbtn--${tone}${className ? ` ${className}` : ""}`} ref={ref} {...rest}>
      {icon ? (
        <span aria-hidden="true" className="qbtn__icon">
          {icon}
        </span>
      ) : null}
      <span className="qbtn__label">{children}</span>
    </a>
  );
}

export function ArrowGlyph() {
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
