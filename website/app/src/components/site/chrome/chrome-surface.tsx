/**
 * Compatibility shim. The liquid chrome WebGL experiment that used to live in
 * this folder was retired in favour of the CSS/SVG liquid glass in
 * ../glass (no second WebGL context next to the ambient background).
 *
 * ChromeSurface now renders nothing, so a host that still includes it keeps
 * its own CSS fallback (it never receives [data-chrome-live]). New code
 * should use the .lg classes with <GlassFx /> and useLiquidGlass from
 * ../glass/liquid-glass instead.
 */
export type ChromeVariant = "chrome" | "rim";

export function ChromeSurface(_props: { variant: ChromeVariant }) {
  return null;
}
