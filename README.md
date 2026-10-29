# Rastgar Engineering: website redesign concept

A redesign concept for [Rastgar Engineering](https://www.rastgar.com), a manufacturer of heavy-duty truck wheel hubs, brake drums and wheel-end assemblies (Islamabad, since 1967).

Live preview: https://rastgar-redesign.higgsfield.app

## What's in it

- **Scroll-driven 3D hero.** A wheel hub built in code with three.js. As you scroll, the camera moves around it and the hub comes apart into an exploded view, with each part labelled.
- **Living background.** A WebGL shader of slow cobalt and navy currents with red embers. It reacts to scroll and to the mouse.
- **Home page sections:** product lines, the 11-step manufacturing process, key numbers, engineering services, certifications and contact.
- **Liquid-glass buttons:** rounded, see-through glass pills with a pointer-tracked highlight and a press effect. In Chrome-based browsers the background bends at their edges.
- **Catalog page** (`/catalog`): search and filter 641 real parts by part number, OEM number, brand or type.
- **Quote, Media and Careers pages:** in progress.

## Project layout

```
website/
  app/                      TanStack Start app (React 19, SSR, Vite, bun)
    src/routes/_site/       Pages: home, catalog, quote, media, careers
    src/components/hub/     3D wheel hub scene and scroll stage
    src/components/site/    Nav, sections, buttons, background, styles
    src/components/catalog/ Catalog page and part data
    scripts/render-hub/     Offline renderer for posters and product images
    public/assets/          Renders, logo, social preview images
    design-brief.md         Design decisions
.claude/skills/             Higgsfield companion skills for Claude Code
```

## Run it locally

You need [bun](https://bun.sh).

```bash
cd website/app
bun install
bun run dev        # http://localhost:3000
bun run build      # production build
bun run typecheck
```

## Notes

- This is a concept site, so it collects no visitor data. Quote and job-application buttons compose an email to Rastgar's real addresses.
- Product facts and part data come from Rastgar's public website. All page copy was written for this redesign.
- The 3D renders are illustrative, not exact Rastgar parts.
