/**
 * Liquid glass behaviour shared by every call to action.
 *
 * A glass surface is any element with the class "lg" (styled in glass.css)
 * that holds a <GlassFx /> as its first child. useLiquidGlass(ref) wires up
 * the host element and every glass surface inside it:
 * - edge refraction sized to each surface (Chromium only, see refraction.ts);
 * - a specular glint that follows the pointer (CSS vars --gx/--gy, no React
 *   state per move);
 * - a highlight ripple from the press point (Web Animations API);
 * - an optional magnetic pull toward the pointer (CSS vars --mx/--my).
 * The squish on press and the springy rebound are pure CSS (:active).
 * Under prefers-reduced-motion only the static refraction is attached.
 */
import { useEffect } from "react";
import type { RefObject } from "react";

import { attachRefraction } from "./refraction";

import "./glass.css";

/** Decorative layer every glass surface carries: it clips the press ripple. */
export function GlassFx() {
  return (
    <span aria-hidden="true" className="lg__fx">
      <span className="lg__ripple" />
    </span>
  );
}

interface LiquidGlassOptions {
  /** Share of the pointer offset the host follows, 0 for none. */
  magnetic?: number;
}

export function useLiquidGlass<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { magnetic = 0 }: LiquidGlassOptions = {}
) {
  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const surfaces = [
      ...(host.classList.contains("lg") ? [host] : []),
      ...Array.from(host.querySelectorAll<HTMLElement>(".lg")),
    ];
    const releases = surfaces.map((surface) => attachRefraction(surface));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      return () => releases.forEach((release) => release());
    }
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const track = (event: PointerEvent) => {
      for (const surface of surfaces) {
        const rect = surface.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const gx = ((event.clientX - rect.left) / rect.width) * 100;
        const gy = ((event.clientY - rect.top) / rect.height) * 100;
        surface.style.setProperty("--gx", `${gx.toFixed(1)}%`);
        surface.style.setProperty("--gy", `${gy.toFixed(1)}%`);
      }
    };

    const onMove = (event: PointerEvent) => {
      track(event);
      if (magnetic > 0 && fine) {
        const rect = host.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);
        host.style.setProperty("--mx", `${(x * magnetic).toFixed(1)}px`);
        host.style.setProperty("--my", `${(y * magnetic).toFixed(1)}px`);
      }
    };

    const onLeave = () => {
      for (const surface of surfaces) {
        surface.style.removeProperty("--gx");
        surface.style.removeProperty("--gy");
      }
      host.style.setProperty("--mx", "0px");
      host.style.setProperty("--my", "0px");
    };

    const onDown = (event: PointerEvent) => {
      track(event);
      // Ripple in the innermost surface under the press point.
      for (let i = surfaces.length - 1; i >= 0; i--) {
        const surface = surfaces[i];
        const rect = surface.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) continue;
        const ripple = surface.querySelector<HTMLElement>(":scope > .lg__fx > .lg__ripple");
        if (!ripple || typeof ripple.animate !== "function") return;
        const size = Math.max(rect.width, rect.height) * 2.2;
        // Offsets in the surface's own (unscaled) box.
        const scaleX = rect.width / surface.offsetWidth || 1;
        const scaleY = rect.height / surface.offsetHeight || 1;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${(event.clientX - rect.left) / scaleX}px`;
        ripple.style.top = `${(event.clientY - rect.top) / scaleY}px`;
        ripple.animate(
          [
            { opacity: 0.6, transform: "translate(-50%, -50%) scale(0.05)" },
            { opacity: 0, transform: "translate(-50%, -50%) scale(1)" },
          ],
          { duration: 720, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        );
        return;
      }
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      releases.forEach((release) => release());
    };
  }, [ref, magnetic]);
}
