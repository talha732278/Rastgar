/**
 * Living page background. One fixed, full-viewport WebGL canvas behind all
 * content, rendered at reduced resolution and upscaled by CSS.
 *
 * - Moves on its own: slow molten currents on a 20 to 40 second rhythm.
 * - Scroll: the field rides up with the page, scroll velocity pushes the
 *   flow, page progress re-composes the light pools, and the red embers
 *   heat up while the foundry chapter or the process section is on screen.
 * - Pointer (fine pointers only): a soft cool light follows the cursor.
 *
 * Capped near 45 fps, paused while the tab is hidden, one static frame under
 * prefers-reduced-motion, and the CSS gradient fallback stays when WebGL is
 * unavailable. Server render is the empty fallback layer; everything else
 * runs in the effect.
 */
import { useEffect, useRef } from "react";

import type { AmbientFrame, AmbientRenderer } from "./ambient-gl";

import "./ambient.css";

const FRAME_MS = 1000 / 45;
/** Elements whose presence on screen heats the embers. */
const EMBER_SOURCES = ["foundry", "process"];
const EMBER_REST = 0.1;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Share of the viewport an element covers, 0 to 1. */
function coverage(el: HTMLElement | null, viewport: number): number {
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const visible = Math.min(rect.bottom, viewport) - Math.max(rect.top, 0);
  return clamp(visible / viewport, 0, 1);
}

export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let destroyed = false;
    let renderer: AmbientRenderer | null = null;
    let raf = 0;
    let prev = 0;
    let acc = 0;
    let lastDraw = 0;

    // Motion state.
    let flow = 8 + Math.random() * 30;
    let clock = 0;
    let scroll = window.scrollY / Math.max(1, window.innerHeight);
    let lastScroll = scroll;
    let velocity = 0;
    let ember = EMBER_REST;
    let emberTarget = EMBER_REST;
    let docSpan = 1;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let pointerTX = 0.5;
    let pointerTY = 0.5;
    let pointerAmt = 0;
    let pointerOn = false;
    let measuredAt = -1;
    const emberEls = EMBER_SOURCES.map((id) => document.getElementById(id));

    const frame: AmbientFrame = {
      clock: 0,
      ember: EMBER_REST,
      pointer: [0.5, 0.5, 0],
      progress: 0,
      scroll,
      time: flow,
      velocity: 0,
    };

    const measureDoc = () => {
      docSpan = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    const sizeCanvas = () => {
      if (!renderer) return;
      const rect = canvas.getBoundingClientRect();
      const long = Math.max(rect.width, rect.height, 1);
      // About half resolution, never more than 960px on the long side, and
      // at least 640px on small screens so the sheen stays crisp on phones.
      const scale = Math.min(960 / long, Math.max(0.5, 640 / long));
      renderer.resize(rect.width * scale, rect.height * scale);
      measureDoc();
    };

    const measureEmber = (viewport: number) => {
      let heat = 0;
      for (const el of emberEls) heat = Math.max(heat, coverage(el, viewport));
      emberTarget = EMBER_REST + (1 - EMBER_REST) * Math.min(1, heat * 1.6);
    };

    const paint = () => {
      if (!renderer) return;
      renderer.render(frame);
      if (root.dataset.live !== "true") root.dataset.live = "true";
    };

    const step = (now: number) => {
      raf = window.requestAnimationFrame(step);
      const elapsed = prev ? now - prev : FRAME_MS;
      prev = now;
      acc += elapsed;
      if (acc < FRAME_MS) return;
      acc = Math.min(acc - FRAME_MS, FRAME_MS);
      const dt = lastDraw ? Math.min(0.25, (now - lastDraw) / 1000) : 1 / 45;
      lastDraw = now;

      const viewport = window.innerHeight || 1;
      const rawScroll = window.scrollY / viewport;
      const rawVelocity = (rawScroll - lastScroll) / Math.max(dt, 1 / 120);
      lastScroll = rawScroll;
      velocity += (clamp(rawVelocity, -4, 4) - velocity) * (1 - Math.exp(-dt * 5));
      scroll += (rawScroll - scroll) * (1 - Math.exp(-dt * 6));

      // Embers follow what is on screen; re-measure while scrolling and
      // every half second otherwise (cheap: two rects).
      if (Math.abs(rawVelocity) > 0.001 || now - measuredAt > 500) {
        measuredAt = now;
        measureEmber(viewport);
      }
      ember += (emberTarget - ember) * (1 - Math.exp(-dt * 1.6));

      const speed = Math.min(Math.abs(velocity), 3);
      flow += dt * (1 + speed * 0.9);
      clock += dt;

      const follow = 1 - Math.exp(-dt * 2.6);
      pointerX += (pointerTX - pointerX) * follow;
      pointerY += (pointerTY - pointerY) * follow;
      pointerAmt += ((pointerOn ? 1 : 0) - pointerAmt) * (1 - Math.exp(-dt * 1.8));

      frame.time = flow;
      frame.clock = clock;
      frame.scroll = scroll;
      frame.velocity = velocity / (1 + Math.abs(velocity) * 0.35);
      frame.progress = clamp(window.scrollY / docSpan, 0, 1);
      frame.ember = ember;
      frame.pointer[0] = pointerX;
      frame.pointer[1] = pointerY;
      frame.pointer[2] = pointerAmt;
      paint();
    };

    const start = () => {
      if (raf || reduce || !renderer || document.hidden || destroyed) return;
      prev = 0;
      lastDraw = 0;
      acc = FRAME_MS;
      raf = window.requestAnimationFrame(step);
    };
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerTX = event.clientX / (window.innerWidth || 1);
      pointerTY = event.clientY / (window.innerHeight || 1);
      if (!pointerOn) {
        // Appear where the cursor is instead of sliding in from the centre.
        if (pointerAmt < 0.05) {
          pointerX = pointerTX;
          pointerY = pointerTY;
        }
        pointerOn = true;
      }
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointerOn = false;
    };
    const onBlur = () => {
      pointerOn = false;
    };

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvas();
      if (reduce) paint();
    });

    void import("./ambient-gl")
      .then((mod) => {
        if (destroyed) return;
        renderer = mod.createAmbientRenderer(canvas);
        if (!renderer) {
          root.dataset.gl = "off";
          return;
        }
        sizeCanvas();
        measureEmber(window.innerHeight || 1);
        if (reduce) {
          // One composed still: no clock, no scroll, no pointer.
          frame.time = 18;
          frame.clock = 0;
          frame.scroll = 0;
          frame.ember = EMBER_REST + 0.1;
          paint();
        } else {
          ember = emberTarget;
          start();
        }
        resizeObserver.observe(canvas);
      })
      .catch(() => {
        root.dataset.gl = "off";
      });

    document.addEventListener("visibilitychange", onVisibility);
    if (finePointer && !reduce) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerout", onPointerOut, { passive: true });
      window.addEventListener("blur", onBlur);
    }

    return () => {
      destroyed = true;
      stop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", onBlur);
      renderer?.dispose();
      renderer = null;
      delete root.dataset.live;
    };
  }, []);

  return (
    <div aria-hidden="true" className="ambient" ref={rootRef}>
      <canvas className="ambient__canvas" ref={canvasRef} />
    </div>
  );
}
