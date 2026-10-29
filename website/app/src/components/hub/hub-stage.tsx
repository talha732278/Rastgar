/**
 * The journey: a sticky WebGL stage whose camera, light and exploded view are
 * driven by scroll, with the five chapters as server-rendered articles over it.
 * The 3D scene loads in an effect (never during SSR); until its first frame
 * paints, and whenever WebGL is unavailable or reduced motion is requested,
 * the pre-rendered posters of the same scene carry the story.
 */
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { CALLOUTS, CHAPTERS } from "@/components/site/content";
import { scrollToY } from "@/components/site/smooth-scroll";
import type { HubScene } from "./hub-scene";

import "./hub-stage.css";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** Scroll distance per chapter, in viewport heights (see hub-stage.css). */
const CHAPTER_VH = [120, 130, 130, 130, 170];

interface HubStageProps {
  heroActions: ReactNode;
}

export function HubStage({ heroActions }: HubStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calloutLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const calloutLayer = calloutLayerRef.current;
    if (!root || !canvas || !calloutLayer) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const articles = Array.from(root.querySelectorAll<HTMLElement>("[data-chapter]"));
    const railButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-rail]"));
    const callouts = new Map<string, HTMLElement>();
    for (const el of calloutLayer.querySelectorAll<HTMLElement>("[data-callout]")) {
      callouts.set(el.dataset.callout ?? "", el);
    }

    let destroyed = false;
    let frame = 0;
    let running = true;
    let scene: HubScene | null = null;
    let journeyState: typeof import("./hub-scene").journeyState | null = null;
    let progress = 0;
    let target = 0;
    let px = 0;
    let py = 0;
    let tpx = 0;
    let tpy = 0;
    let active = -1;
    let lastKey = "";
    let width = 0;
    let height = 0;
    let lastTime = 0;
    const startedAt = performance.now();

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      target = span > 0 ? clamp01(-rect.top / span) : 0;
      const mid = window.innerHeight * 0.5;
      let next = 0;
      articles.forEach((article, index) => {
        if (article.getBoundingClientRect().top <= mid) next = index;
      });
      if (next !== active) {
        active = next;
        root.dataset.active = String(next);
        railButtons.forEach((button, index) => {
          if (index === next) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        });
      }
    };

    const onRail = (event: Event) => {
      const index = Number((event.currentTarget as HTMLElement).dataset.rail);
      const article = articles[index];
      if (!article) return;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const hold = Math.max(0, article.offsetHeight - window.innerHeight) / 2;
      scrollToY(top + hold);
    };
    railButtons.forEach((b) => b.addEventListener("click", onRail));

    if (reduce) {
      // Static story: no WebGL, no tweening. Posters swap by chapter.
      root.dataset.mode = "static";
      const onScroll = () => measure();
      measure();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        railButtons.forEach((b) => b.removeEventListener("click", onRail));
      };
    }

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect || !scene) return;
      width = rect.width;
      height = rect.height;
      scene.setSize(width, height, Math.min(window.devicePixelRatio || 1, 1.75));
      lastKey = "";
    };

    const placeCallouts = (reveal: number) => {
      if (!scene) return;
      calloutLayer.style.setProperty("--reveal", reveal.toFixed(3));
      if (reveal <= 0.001) return;
      for (const anchor of scene.project()) {
        const el = callouts.get(anchor.id);
        if (!el) continue;
        el.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;
        el.dataset.hidden = anchor.visible ? "false" : "true";
      }
    };

    const tick = () => {
      frame = 0;
      if (destroyed || !running || !scene || !journeyState) return;
      measure();
      const now = performance.now();
      const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      progress += (target - progress) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - progress) < 0.0004) progress = target;
      const follow = 1 - Math.exp(-dt * 3.5);
      px += (tpx - px) * follow;
      py += (tpy - py) * follow;
      const intro = smooth((now - startedAt - 150) / 1600);

      const key = `${progress.toFixed(4)}|${px.toFixed(3)}|${py.toFixed(3)}|${intro.toFixed(3)}|${width}x${height}`;
      if (key !== lastKey) {
        lastKey = key;
        scene.apply(journeyState(progress, intro, px, py));
        scene.render();
        placeCallouts(smooth((progress - 0.8) / 0.1));
        root.style.setProperty("--hub-progress", progress.toFixed(4));
        if (root.dataset.live !== "true") root.dataset.live = "true";
      }
      frame = window.requestAnimationFrame(tick);
      if (key === lastKey && progress === target && intro >= 1) {
        lastTime = 0;
      }
    };

    const wake = () => {
      if (!frame && running && scene) frame = window.requestAnimationFrame(tick);
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      tpx = (event.clientX / window.innerWidth) * 2 - 1;
      tpy = (event.clientY / window.innerHeight) * 2 - 1;
      wake();
    };
    const onScroll = () => wake();

    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) wake();
      },
      { rootMargin: "10% 0px" }
    );
    visibility.observe(root);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      wake();
    });

    void import("./hub-scene")
      .then((mod) => {
        if (destroyed) return;
        try {
          scene = mod.createHubScene({ canvas });
        } catch {
          root.dataset.webgl = "off";
          return;
        }
        journeyState = mod.journeyState;
        resizeObserver.observe(canvas.parentElement ?? canvas);
        resize();
        measure();
        progress = target;
        wake();
      })
      .catch(() => {
        root.dataset.webgl = "off";
      });

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      destroyed = true;
      if (frame) window.cancelAnimationFrame(frame);
      visibility.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      railButtons.forEach((b) => b.removeEventListener("click", onRail));
      scene?.dispose();
      scene = null;
      delete root.dataset.live;
    };
  }, []);

  return (
    <section aria-label="How a Rastgar wheel end is made" className="hub" id="top" ref={rootRef}>
      <div className="hub__stage">
        <div aria-hidden="true" className="hub__posters">
          <picture className="hub__poster hub__poster--hero">
            <source media="(max-aspect-ratio: 19/20)" srcSet="/assets/hub/hero-mobile.webp" />
            <img alt="" decoding="async" fetchPriority="high" src="/assets/hub/hero-desktop.webp" />
          </picture>
          <picture className="hub__poster hub__poster--exploded">
            <source media="(max-aspect-ratio: 19/20)" srcSet="/assets/hub/exploded-mobile.webp" />
            <img alt="" decoding="async" loading="lazy" src="/assets/hub/exploded-desktop.webp" />
          </picture>
        </div>
        <canvas aria-hidden="true" className="hub__canvas" ref={canvasRef} />
        <div aria-hidden="true" className="hub__callouts" ref={calloutLayerRef}>
          {CALLOUTS.map((callout, index) => (
            <div
              className="hub-callout"
              data-callout={callout.id}
              data-dir={index % 2 === 0 ? "up" : "down"}
              data-priority={callout.priority}
              key={callout.id}
            >
              <span className="hub-callout__dot" />
              <span className="hub-callout__line" />
              <span className="hub-callout__text">
                <strong>{callout.label}</strong>
                <small>{callout.detail}</small>
              </span>
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="hub__scrim hub__scrim--left" />
        <div aria-hidden="true" className="hub__scrim hub__scrim--right" />
        <div aria-hidden="true" className="hub__scrim hub__scrim--bottom" />
        <div aria-hidden="true" className="hub__shade" />
        <nav aria-label="Chapters" className="hub__rail">
          <span aria-hidden="true" className="hub__rail-track">
            <span className="hub__rail-fill" />
          </span>
          {CHAPTERS.map((chapter, index) => (
            <button className="hub__rail-button" data-rail={index} key={chapter.id} type="button">
              <span className="hub__rail-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="hub__rail-label">{chapter.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="hub__story">
        {CHAPTERS.map((chapter, index) => {
          const Heading = index === 0 ? "h1" : "h2";
          return (
            <article
              className="hub-chapter"
              data-align={chapter.align}
              data-chapter={index}
              id={chapter.id}
              key={chapter.id}
              style={{ minHeight: `${CHAPTER_VH[index]}dvh` }}
            >
              <div className="hub-chapter__pin">
                <div className="hub-chapter__copy">
                  <Heading className={index === 0 ? "hub-chapter__title hub-chapter__title--hero" : "hub-chapter__title"}>
                    {index === 0
                      ? chapter.title.split(" ").map((word, i) => (
                          <span className="hub-word" key={`${word}-${i}`}>
                            <span style={{ animationDelay: `${180 + i * 70}ms` }}>{word}</span>
                          </span>
                        ))
                      : chapter.title}
                  </Heading>
                  <p className="hub-chapter__body">{chapter.body}</p>
                  {chapter.tags ? (
                    <ul className="hub-chapter__tags">
                      {chapter.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                  {index === 0 ? <div className="hub-chapter__actions">{heroActions}</div> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
