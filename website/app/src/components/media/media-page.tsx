/**
 * Media page: newsroom hero, a featured story with the rest of the news in a
 * card grid, the trade show timeline, a photo gallery with an accessible
 * lightbox (native <dialog>: focus is trapped and Escape closes it), and the
 * media kit band. Content lives in ./media-data.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CONTACT } from "@/components/site/content";

import { GlassButton, GlassChip, GlassLink } from "./glass-controls";
import { GALLERY, MEDIA_KIT, NEWS, SHOWS, SHOW_ARCHIVE } from "./media-data";
import type { GalleryGroup, GalleryItem, NewsItem } from "./media-data";

import "./media.css";

function Arrow({ dir = "right" }: { dir?: "right" | "left" | "down" }) {
  const d =
    dir === "down"
      ? "M12 5.5v12.5M6.5 12.5 12 18l5.5-5.5"
      : dir === "left"
        ? "M18.5 12H6M11.5 6.5 6 12l5.5 5.5"
        : "M5.5 12h12.5M12.5 6.5 18 12l-5.5 5.5";
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={d} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function NewsMeta({ item }: { item: NewsItem }) {
  return (
    <p className="md-meta">
      <span className="md-pill">{item.category}</span>
      <time dateTime={item.dateTime}>{item.date}</time>
    </p>
  );
}

/* ---------------------------------------------------------------- hero */

function MediaHero() {
  return (
    <section aria-labelledby="media-title" className="md-hero">
      <div className="shell">
        <header className="section-head md-hero__head">
          <p className="eyebrow">Media</p>
          <h1 className="section-title section-title--xl" id="media-title">
            Newsroom
          </h1>
          <p className="section-lede">Awards, plant visits, training and the trade shows where we meet our customers.</p>
          <nav aria-label="On this page" className="md-hero__jump">
            <a href="#news">News</a>
            <a href="#shows">Trade shows</a>
            <a href="#gallery">Gallery</a>
            <a href="#media-kit">Media kit</a>
          </nav>
        </header>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- news */

function News({ onOpen }: { onOpen: (id: string) => void }) {
  const [featured, ...rest] = NEWS;
  return (
    <section aria-labelledby="news-title" className="md-news" id="news">
      <div className="shell">
        <h2 className="sr-only" id="news-title">
          Latest news
        </h2>
        <article className="md-feature">
          <button
            aria-label={`View photo larger: ${featured.photo.alt}`}
            className="md-feature__media"
            onClick={() => onOpen(featured.id)}
            type="button"
          >
            <img
              alt={featured.photo.alt}
              decoding="async"
              height={featured.photo.height}
              sizes="(max-width: 900px) 100vw, 60vw"
              src={featured.photo.src}
              srcSet={`${featured.photo.thumb} 720w, ${featured.photo.src} ${featured.photo.width}w`}
              width={featured.photo.width}
            />
          </button>
          <div className="md-feature__copy">
            <p className="md-feature__flag">Featured</p>
            <NewsMeta item={featured} />
            <h3 className="md-feature__title">{featured.title}</h3>
            <p className="md-feature__body">{featured.body}</p>
          </div>
        </article>

        <ul className="md-grid">
          {rest.map((item) => (
            <li key={item.id}>
              <article className="md-card">
                <button
                  aria-label={`View photo larger: ${item.photo.alt}`}
                  className="md-card__media"
                  onClick={() => onOpen(item.id)}
                  type="button"
                >
                  <img
                    alt={item.photo.alt}
                    decoding="async"
                    height={item.photo.height}
                    loading="lazy"
                    src={item.photo.thumb}
                    width={item.photo.width}
                  />
                </button>
                <div className="md-card__copy">
                  <NewsMeta item={item} />
                  <h3 className="md-card__title">{item.title}</h3>
                  <p className="md-card__body">{item.body}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- trade shows */

/** Gallery ids are the photo file names. */
const photoId = (src: string) => src.split("/").pop()?.replace(".webp", "") ?? "";

function Shows({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section aria-labelledby="shows-title" className="md-shows" id="shows">
      <div className="shell">
        <header className="section-head">
          <p className="eyebrow">Trade shows</p>
          <h2 className="section-title" id="shows-title">
            Where to find us
          </h2>
          <p className="section-lede">We exhibit at the main aftermarket shows to meet distributors and fleet buyers face to face.</p>
        </header>

        <ol className="md-timeline">
          {SHOWS.map((show) => (
            <li className="md-show" key={show.id}>
              <span aria-hidden="true" className="md-show__node" />
              <p className="md-show__year">{show.year}</p>
              <div className="md-show__card">
                <div className="md-show__copy">
                  <h3 className="md-show__name">
                    {show.name} {show.year}
                  </h3>
                  <p className="md-show__when">
                    <time dateTime={show.dateTime}>{show.dates}</time>
                    <span aria-hidden="true"> / </span>
                    {show.place}
                  </p>
                  <p className="md-show__body">{show.body}</p>
                  <ul className="md-show__tags">
                    {show.details.map((detail) => (
                      <li className="md-pill md-pill--line" key={detail}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                {show.photo ? (
                  <button
                    aria-label={`View photo larger: ${show.photo.alt}`}
                    className="md-show__media"
                    onClick={() => onOpen(photoId(show.photo?.src ?? ""))}
                    type="button"
                  >
                    <img
                      alt={show.photo.alt}
                      decoding="async"
                      height={show.photo.height}
                      loading="lazy"
                      src={show.photo.thumb}
                      width={show.photo.width}
                    />
                  </button>
                ) : (
                  <div aria-hidden="true" className="md-show__type">
                    <span>{show.details[1] ?? show.year}</span>
                    <img alt="" decoding="async" loading="lazy" src="/assets/products/preadjusted-assembly.webp" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <details className="md-archive">
          <summary>
            <span>Earlier shows</span>
            <span className="md-archive__count">{SHOW_ARCHIVE.length}</span>
            <Arrow dir="down" />
          </summary>
          <ul className="md-archive__list">
            {SHOW_ARCHIVE.map((show) => (
              <li key={`${show.name}-${show.year}`}>
                <span className="md-archive__year">{show.year}</span>
                <span className="md-archive__name">{show.name}</span>
                <span className="md-archive__place">{show.place}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

const FILTERS: { id: "all" | GalleryGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "shows", label: "Trade shows" },
  { id: "news", label: "Company" },
];

function Gallery({ items, onOpen }: { items: GalleryItem[]; onOpen: (id: string) => void }) {
  return (
    <ul className="md-gallery">
      {items.map((item) => (
        <li key={item.id}>
          <button aria-label={`View larger: ${item.caption}`} className="md-tile" onClick={() => onOpen(item.id)} type="button">
            <img alt={item.alt} decoding="async" height={item.height} loading="lazy" src={item.thumb} width={item.width} />
            <span className="md-tile__caption">{item.caption}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const item = index === null ? null : items[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!open && dialog.open) dialog.close();
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  return (
    <dialog
      aria-label="Photo viewer"
      className="md-lightbox"
      data-lenis-prevent=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onStep(1);
        if (event.key === "ArrowLeft") onStep(-1);
      }}
      ref={ref}
    >
      {item ? (
        <figure className="md-lightbox__figure">
          <img alt={item.alt} decoding="async" height={item.height} key={item.id} src={item.src} width={item.width} />
          <figcaption>
            <span>{item.caption}</span>
            <span className="md-lightbox__count">
              {(index ?? 0) + 1} / {items.length}
            </span>
          </figcaption>
        </figure>
      ) : null}
      <div className="md-lightbox__controls">
        <GlassButton className="gx-round" label="Previous photo" onClick={() => onStep(-1)}>
          <Arrow dir="left" />
        </GlassButton>
        <GlassButton className="gx-round" label="Next photo" onClick={() => onStep(1)}>
          <Arrow />
        </GlassButton>
        <GlassButton className="gx-round md-lightbox__close" label="Close photo viewer" onClick={onClose}>
          <CloseGlyph />
        </GlassButton>
      </div>
    </dialog>
  );
}

function GallerySection({
  filter,
  setFilter,
  items,
  onOpen,
}: {
  filter: "all" | GalleryGroup;
  setFilter: (next: "all" | GalleryGroup) => void;
  items: GalleryItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-labelledby="gallery-title" className="md-gallery-section" id="gallery">
      <div className="shell">
        <div className="md-gallery-head">
          <header className="section-head">
            <p className="eyebrow">Gallery</p>
            <h2 className="section-title" id="gallery-title">
              Photos
            </h2>
            <p className="section-lede">From our stands abroad and from the plant in Islamabad. Select a photo to see it larger.</p>
          </header>
          <div aria-label="Filter photos" className="md-filters" role="group">
            {FILTERS.map((option) => (
              <GlassChip
                count={option.id === "all" ? GALLERY.length : GALLERY.filter((g) => g.group === option.id).length}
                key={option.id}
                onClick={() => setFilter(option.id)}
                pressed={filter === option.id}
              >
                {option.label}
              </GlassChip>
            ))}
          </div>
        </div>
        <Gallery items={items} onOpen={onOpen} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ media kit */

function MediaKit() {
  return (
    <section aria-labelledby="kit-title" className="md-kit-section" id="media-kit">
      <div className="shell">
        <div className="md-kit">
          <div className="md-kit__copy">
            <p className="eyebrow">Media kit</p>
            <h2 className="section-title" id="kit-title">
              For press
            </h2>
            <p className="md-kit__lede">Logo and link preview card, free to use when writing about Rastgar Engineering.</p>
            <p className="md-kit__contact">
              Press contact{" "}
              <a className="md-link" href={`mailto:${CONTACT.supportEmail}?subject=${encodeURIComponent("Press enquiry")}`}>
                {CONTACT.supportEmail}
              </a>
            </p>
          </div>
          <ul className="md-kit__files">
            {MEDIA_KIT.map((file) => (
              <li className="md-file" key={file.id}>
                <div className={`md-file__preview md-file__preview--${file.id}`}>
                  <img alt="" decoding="async" loading="lazy" src={file.file} />
                </div>
                <div className="md-file__meta">
                  <h3 className="md-file__title">{file.title}</h3>
                  <p className="md-file__format">{file.format}</p>
                </div>
                <GlassLink
                  className="gx-pill gx-pill--sm gx-pill--bead-end"
                  download={file.fileName}
                  href={file.file}
                  label={`Download ${file.title}`}
                >
                  <span>Download</span>
                  <span aria-hidden="true" className="gx-bead gx-bead--nudge-y">
                    <Arrow dir="down" />
                  </span>
                </GlassLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- page */

export function MediaPage() {
  const [filter, setFilter] = useState<"all" | GalleryGroup>("all");
  const [viewer, setViewer] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  const filtered = useMemo(() => (filter === "all" ? GALLERY : GALLERY.filter((g) => g.group === filter)), [filter]);

  // Open from anywhere: the gallery opens within its filtered set, news and
  // show photos open within the full gallery.
  const openIn = useCallback((items: GalleryItem[], id: string) => {
    const index = items.findIndex((g) => g.id === id);
    if (index >= 0) setViewer({ index, items });
  }, []);

  const step = useCallback((delta: number) => {
    setViewer((current) =>
      current ? { ...current, index: (current.index + delta + current.items.length) % current.items.length } : current
    );
  }, []);

  return (
    <>
      <MediaHero />
      <News onOpen={(id) => openIn(GALLERY, id)} />
      <Shows onOpen={(id) => openIn(GALLERY, id)} />
      <GallerySection filter={filter} items={filtered} onOpen={(id) => openIn(filtered, id)} setFilter={setFilter} />
      <MediaKit />
      <Lightbox
        index={viewer?.index ?? null}
        items={viewer?.items ?? GALLERY}
        onClose={() => setViewer(null)}
        onStep={step}
      />
    </>
  );
}
