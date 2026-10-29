/**
 * Lenis smooth scrolling bridged to GSAP's ticker so ScrollTrigger and the
 * hub stage read the same scroll position every frame. Skipped entirely under
 * prefers-reduced-motion. In-page hash links are routed through Lenis so the
 * fixed nav never covers a section heading.
 */
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

interface LenisLike {
  scrollTo: (
    target: number | HTMLElement,
    options?: { offset?: number; duration?: number; immediate?: boolean }
  ) => void;
}

let lenis: LenisLike | null = null;

const NAV_OFFSET = -72;

export function scrollToY(y: number) {
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.4 });
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ behavior: reduce ? "auto" : "smooth", top: y });
}

/** Jump to the top without easing, e.g. after a client-side route change. */
export function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export function SmoothScroll() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!window.location.hash) resetScroll();
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let destroyed = false;
    let cleanup = () => {};

    void Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
        if (destroyed) return;
        gsap.registerPlugin(ScrollTrigger);

        const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
        lenis = instance;
        instance.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => instance.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const onClick = (event: MouseEvent) => {
          const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
          if (!link) return;
          const href = link.getAttribute("href") ?? "";
          // "/#id" only scrolls in place when we are already on the home page.
          if (href.startsWith("/#") && window.location.pathname !== "/") return;
          const id = href.slice(href.indexOf("#") + 1);
          const target = id ? document.getElementById(id) : null;
          if (!target) return;
          event.preventDefault();
          instance.scrollTo(target, { duration: 1.4, offset: id === "top" ? 0 : NAV_OFFSET });
          window.history.replaceState(null, "", `${window.location.pathname}#${id}`);
        };
        document.addEventListener("click", onClick);

        cleanup = () => {
          document.removeEventListener("click", onClick);
          gsap.ticker.remove(raf);
          instance.destroy();
          lenis = null;
        };
      }
    );

    return () => {
      destroyed = true;
      cleanup();
    };
  }, []);

  return null;
}
