/**
 * Shared frame for every page of the site: the living background, smooth
 * scrolling, the nav and the footer. Rendered once by the `_site` layout route
 * so the background and scroll engine survive client-side navigation.
 */
import type { ReactNode } from "react";

import { AmbientBackground } from "./ambient/ambient-background";
import { SiteFooter, SiteNav } from "./sections";
import { SmoothScroll } from "./smooth-scroll";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SmoothScroll />
      <AmbientBackground />
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
