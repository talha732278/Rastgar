/**
 * Page sections after the journey. Copy and data live in ./content.ts.
 * All motion here is transform-only and runs from effects; every section is
 * fully readable as server-rendered HTML before any script runs.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Crosshair,
  CubeFocus,
  Factory,
  Fire,
  Flask,
  GearSix,
  Graph,
  Lightning,
  List,
  MagnifyingGlass,
  Package,
  PenNib,
  Ruler,
  Scan,
  SealCheck,
  SprayBottle,
  Stack,
  Truck,
  Wrench,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";

import "@fontsource/saira-semi-condensed/500.css";
import "@fontsource/saira-semi-condensed/600.css";
import "@fontsource/saira-semi-condensed/700.css";
import "@fontsource/saira/400.css";
import "@fontsource/saira/500.css";
import "@fontsource/jetbrains-mono/500.css";

import {
  CATALOG_EXTRAS,
  CERTIFICATIONS,
  CONTACT,
  PROCESS,
  PRODUCTS,
  SERVICES,
  quoteHref,
  statsFor,
} from "./content";
import type { ProcessStep, Service } from "./content";
import { CallPlant, CatalogLink, DocsRequest, NavQuote, SealQuote } from "./ctas";

import "./site.css";

const pad = (n: number) => String(n).padStart(2, "0");
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Icon = ComponentType<IconProps>;

const PROCESS_ICONS: Record<ProcessStep["icon"], Icon> = {
  assembly: Wrench,
  cnc: GearSix,
  distribution: Truck,
  finishing: SprayBottle,
  foundry: Fire,
  inspection: MagnifyingGlass,
  lab: Flask,
  moulding: Stack,
  packaging: Package,
  pattern: Ruler,
  simulation: CubeFocus,
};

const SERVICE_ICONS: Record<Service["icon"], Icon> = {
  drawing: PenNib,
  fea: Graph,
  prototype: Lightning,
  sample: Scan,
  validation: SealCheck,
};

/* ------------------------------------------------------------------ nav */

type NavLinkItem =
  | { kind: "anchor"; href: `/#${string}`; label: string }
  | { kind: "route"; to: "/catalog" | "/media" | "/careers"; label: string };

/** Home sections are plain "/#id" anchors (smooth-scrolled on the home page,
 * a normal navigation elsewhere); pages are router links. */
const NAV_LINKS: NavLinkItem[] = [
  { href: "/#products", kind: "anchor", label: "Products" },
  { kind: "route", label: "Catalog", to: "/catalog" },
  { href: "/#process", kind: "anchor", label: "Process" },
  { kind: "route", label: "Media", to: "/media" },
  { kind: "route", label: "Careers", to: "/careers" },
  { href: "/#contact", kind: "anchor", label: "Contact" },
];

function NavItem({ item, onNavigate }: { item: NavLinkItem; onNavigate?: () => void }) {
  if (item.kind === "route") {
    return (
      <Link activeProps={{ "aria-current": "page" }} onClick={onNavigate} to={item.to}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} onClick={onNavigate}>
      {item.label}
    </a>
  );
}

export function SiteNav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      el.dataset.solid = window.scrollY > 24 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav" data-open={open} data-solid="false" ref={ref}>
      <a aria-label="Rastgar Engineering home" className="nav__brand" href="/#top">
        <img alt="Rastgar Engineering" height={119} src="/assets/brand/rastgar-logo-white.png" width={258} />
      </a>
      <nav aria-label="Primary" className="nav__links" id="nav-links">
        {NAV_LINKS.map((item) => (
          <NavItem item={item} key={item.label} onNavigate={() => setOpen(false)} />
        ))}
      </nav>
      <div className="nav__end">
        <NavQuote />
        <button
          aria-controls="nav-links"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="nav__toggle"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- products */

export function Products() {
  const listRef = useRef<HTMLOListElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    const img = imgRef.current;
    if (!list || !preview || !img) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = prefersReduced();

    for (const product of PRODUCTS) {
      const pre = new Image();
      pre.src = product.image;
    }

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    const loop = () => {
      x += (tx - x) * (reduce ? 1 : 0.14);
      y += (ty - y) * (reduce ? 1 : 0.14);
      preview.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? window.requestAnimationFrame(loop) : 0;
    };
    const onMove = (event: PointerEvent) => {
      const rect = list.getBoundingClientRect();
      tx = event.clientX - rect.left;
      ty = event.clientY - rect.top;
      if (!frame) frame = window.requestAnimationFrame(loop);
    };
    const onEnter = (event: Event) => {
      const row = event.currentTarget as HTMLElement;
      const src = row.dataset.image;
      if (src && img.getAttribute("src") !== src) {
        img.src = src;
        img.alt = "";
      }
      list.dataset.hovering = "true";
    };
    const onLeave = () => {
      list.dataset.hovering = "false";
    };
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-image]"));
    rows.forEach((row) => row.addEventListener("pointerenter", onEnter));
    list.addEventListener("pointermove", onMove);
    list.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      rows.forEach((row) => row.removeEventListener("pointerenter", onEnter));
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section aria-labelledby="products-title" className="products" id="products">
      <div className="shell">
        <header className="section-head">
          <p className="eyebrow">Product lines</p>
          <h2 className="section-title" id="products-title">
            Seven lines. One specialty.
          </h2>
          <p className="section-lede">
            We make wheel ends and very little else. That focus shows up in service life, fit and install time.
          </p>
        </header>

        <div className="products__body">
          <ol className="products__list" data-hovering="false" ref={listRef}>
            {PRODUCTS.map((product, index) => (
              <li key={product.id}>
                <a
                  aria-label={`${product.name}: request a quote`}
                  className="product-row"
                  data-image={product.image}
                  href={quoteHref(product.id)}
                >
                  <span className="product-row__index">{pad(index + 1)}</span>
                  <span className="product-row__name">{product.name}</span>
                  <span className="product-row__body">{product.body}</span>
                  <span className="product-row__specs">
                    {product.specs.map((spec) => (
                      <span key={spec}>{spec}</span>
                    ))}
                  </span>
                  <img
                    alt={product.imageAlt}
                    className="product-row__thumb"
                    decoding="async"
                    height={720}
                    loading="lazy"
                    src={product.image}
                    width={960}
                  />
                  <svg aria-hidden="true" className="product-row__arrow" viewBox="0 0 24 24">
                    <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </a>
              </li>
            ))}
            <figure aria-hidden="true" className="products__preview" ref={previewRef}>
              <img alt="" decoding="async" loading="lazy" ref={imgRef} src={PRODUCTS[0].image} />
            </figure>
          </ol>
          <div className="products__foot">
            <p>{CATALOG_EXTRAS}</p>
            <CatalogLink />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- process */

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const steps = stepsRef.current;
    if (!section || !steps || prefersReduced()) return;

    let destroyed = false;
    let cleanup = () => {};
    const items = Array.from(steps.querySelectorAll<HTMLElement>("[data-step]"));
    let active = 0;

    const setActive = (index: number) => {
      if (index === active) return;
      active = index;
      items.forEach((item, i) => {
        item.dataset.state = i < index ? "done" : i === index ? "active" : "next";
      });
      if (numberRef.current) numberRef.current.textContent = pad(index + 1);
      if (titleRef.current) titleRef.current.textContent = PROCESS[index].title;
    };

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (destroyed) return;
      gsap.registerPlugin(ScrollTrigger);
      section.style.setProperty("--process", "0");
      items.forEach((item, i) => {
        item.dataset.state = i === 0 ? "active" : "next";
      });
      const trigger = ScrollTrigger.create({
        end: "bottom 55%",
        onUpdate: (self) => {
          section.style.setProperty("--process", self.progress.toFixed(4));
          setActive(Math.min(PROCESS.length - 1, Math.floor(self.progress * PROCESS.length)));
        },
        start: "top 55%",
        trigger: steps,
      });
      cleanup = () => trigger.kill();
    });

    return () => {
      destroyed = true;
      cleanup();
    };
  }, []);

  return (
    <section aria-labelledby="process-title" className="process" id="process" ref={sectionRef}>
      <div className="shell process__inner">
        <aside className="process__panel">
          <p className="eyebrow">One campus</p>
          <h2 className="section-title" id="process-title">
            From molten metal to your line.
          </h2>
          <p className="section-lede">
            Few suppliers control every stage. We run all eleven ourselves, so quality is built in rather than inspected in.
          </p>
          <div aria-hidden="true" className="gauge">
            <svg viewBox="0 0 120 120">
              <circle className="gauge__track" cx="60" cy="60" r="52" />
              <circle className="gauge__fill" cx="60" cy="60" pathLength="100" r="52" />
            </svg>
            <span className="gauge__count">
              <span ref={numberRef}>01</span>
              <small>/ {PROCESS.length}</small>
            </span>
          </div>
          <p aria-hidden="true" className="gauge__title" ref={titleRef}>
            {PROCESS[0].title}
          </p>
          <DocsRequest />
        </aside>

        <ol className="process__steps" ref={stepsRef}>
          <span aria-hidden="true" className="process__spine">
            <span className="process__spine-fill" />
          </span>
          {PROCESS.map((step, index) => {
            const StepIcon = PROCESS_ICONS[step.icon];
            return (
              <li className="process-step" data-state={index === 0 ? "active" : "next"} data-step={index} key={step.title}>
                <span aria-hidden="true" className="process-step__node" />
                <span className="process-step__num">{pad(index + 1)}</span>
                <span aria-hidden="true" className="process-step__icon">
                  <StepIcon size={26} weight="light" />
                </span>
                <h3 className="process-step__title">{step.title}</h3>
                <p className="process-step__body">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- numbers */

export function Numbers() {
  const ref = useRef<HTMLElement>(null);
  const stats = statsFor(new Date().getFullYear());

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const counters = Array.from(el.querySelectorAll<HTMLElement>("[data-count]"));
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        el.dataset.counted = "true";
        const start = performance.now();
        const run = (now: number) => {
          const t = Math.min(1, (now - start) / 1600);
          const eased = 1 - (1 - t) ** 4;
          for (const counter of counters) {
            const value = Number(counter.dataset.count);
            counter.textContent = String(Math.round(value * eased));
          }
          frame = t < 1 ? window.requestAnimationFrame(run) : 0;
        };
        frame = window.requestAnimationFrame(run);
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-labelledby="numbers-title" className="numbers" ref={ref}>
      <h2 className="sr-only" id="numbers-title">
        Rastgar in numbers
      </h2>
      <dl className="shell numbers__grid">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <dt className="stat__label">{stat.label}</dt>
            <dd className="stat__value">
              <span data-count={stat.value}>{stat.value}</span>
              {stat.suffix ? <span className="stat__suffix">{stat.suffix}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------- services */

export function Services() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReduced()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>("[data-tilt]"));
    const handlers = cells.map((cell) => {
      const move = (event: PointerEvent) => {
        const rect = cell.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        cell.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
        cell.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
        cell.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
        cell.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
      };
      const leave = () => {
        cell.style.setProperty("--rx", "0deg");
        cell.style.setProperty("--ry", "0deg");
      };
      cell.addEventListener("pointermove", move);
      cell.addEventListener("pointerleave", leave);
      return () => {
        cell.removeEventListener("pointermove", move);
        cell.removeEventListener("pointerleave", leave);
      };
    });
    return () => handlers.forEach((off) => off());
  }, []);

  return (
    <section aria-labelledby="engineering-title" className="services" id="engineering">
      <div className="shell">
        <header className="section-head section-head--narrow">
          <h2 className="section-title" id="engineering-title">
            Engineering before metal is cut.
          </h2>
          <p className="section-lede">Our design team works from your drawing, your sample or a blank sheet.</p>
        </header>
        <div className="bento" ref={gridRef}>
          {SERVICES.map((service) => {
            const ServiceIcon = SERVICE_ICONS[service.icon];
            return (
              <article className={`bento__cell bento__cell--${service.id}`} data-tilt="" key={service.id}>
                {service.id === "oem" ? (
                  <img
                    alt="Line drawing of a wheel-end assembly taken apart along its axle"
                    className="bento__art"
                    decoding="async"
                    height={900}
                    loading="lazy"
                    src="/assets/hub/blueprint.webp"
                    width={1600}
                  />
                ) : null}
                <span aria-hidden="true" className="bento__icon">
                  <ServiceIcon size={28} weight="light" />
                </span>
                <h3 className="bento__title">{service.title}</h3>
                <p className="bento__body">{service.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- certifications */

export function Certifications() {
  return (
    <section aria-labelledby="quality-title" className="quality" id="quality">
      <div className="shell quality__inner">
        <header className="section-head quality__head">
          <h2 className="section-title" id="quality-title">
            Audited. Certified. Accountable.
          </h2>
          <p className="section-lede">
            Independent auditors check how we make every part, how we run the plant and how we treat our people.
          </p>
          <ul aria-label="Quality focus" className="quality__marks">
            <li>
              <Crosshair aria-hidden="true" size={22} weight="light" />
              Full traceability
            </li>
            <li>
              <Factory aria-hidden="true" size={22} weight="light" />
              One audited campus
            </li>
          </ul>
        </header>
        <div className="spec-panel">
          <table className="spec-table">
            <caption className="sr-only">Certifications and affiliations</caption>
            <thead>
              <tr>
                <th scope="col">Standard</th>
                <th scope="col">Scope</th>
              </tr>
            </thead>
            <tbody>
              {CERTIFICATIONS.map((cert) => (
                <tr key={cert.code}>
                  <th scope="row">{cert.code}</th>
                  <td>{cert.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- closing */

export function Closing() {
  return (
    <section aria-labelledby="contact-title" className="closing" id="contact">
      <picture aria-hidden="true" className="closing__art">
        <source media="(max-aspect-ratio: 19/20)" srcSet="/assets/hub/exploded-mobile.webp" />
        <img alt="" decoding="async" loading="lazy" src="/assets/hub/exploded-desktop.webp" />
      </picture>
      <div className="shell closing__inner">
        <div className="closing__copy">
          <h2 className="section-title section-title--xl" id="contact-title">
            Put our hubs on your next axle.
          </h2>
          <p className="section-lede">
            Send a drawing, a part number or a sample. Our engineers reply within one business day.
          </p>
          <div className="closing__actions">
            <SealQuote />
            <CallPlant />
          </div>
        </div>
        <address className="closing__contact">
          <dl>
            <div>
              <dt>Sales</dt>
              <dd>
                <a href={`mailto:${CONTACT.salesEmail}`}>{CONTACT.salesEmail}</a>
              </dd>
            </div>
            <div>
              <dt>Technical support</dt>
              <dd>
                <a href={`mailto:${CONTACT.supportEmail}`}>{CONTACT.supportEmail}</a>
              </dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{CONTACT.hours}</dd>
            </div>
            <div>
              <dt>Plant</dt>
              <dd>
                {CONTACT.address.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </dd>
            </div>
          </dl>
        </address>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <img alt="Rastgar Engineering" className="footer__logo" height={119} src="/assets/brand/rastgar-logo-white.png" width={258} />
        <p className="footer__line">Wheel hubs and wheel-end assemblies for heavy trucks, trailers and buses. Islamabad, since 1967.</p>
        <nav aria-label="Footer" className="footer__links">
          {NAV_LINKS.map((item) => (
            <NavItem item={item} key={item.label} />
          ))}
        </nav>
        <p className="footer__note">Website redesign concept. 3D renders are illustrative.</p>
      </div>
    </footer>
  );
}
