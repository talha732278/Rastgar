# Design brief: Rastgar Engineering (redesign concept)

**Design read:** For OEM purchasing heads, axle engineers and aftermarket distributors deciding whether a Pakistani foundry can be a tier-1 wheel-end partner; register is heavy, precise, confident industrial, never startup-glossy.

**Concept spine:** "The hub, taken apart." The page is one wheel-end assembly examined from the outside in. The scroll literally disassembles a heavy-duty hub into an exploded view, and every chapter names the in-house capability that made the part you are looking at. The pitch writes itself: one campus controls every layer.

**Delivery tier:** cinema (Lenis + GSAP for surrounding motion; the scroll-scrub film is the Tier-1 hero).

**Locked palette (client brand, from rastgar.com logo + theme):**
- `#070D1F` ground (off-black navy, derived from the logo navy)
- `#0B1B3E` surface (the exact logo navy)
- `#EEF1F6` ink (cool white)
- `#8C96AD` muted ink
- `#E30613` accent (Rastgar signal red, the only accent)
- Defense: these are the client's own colors (logo `#0B1B3E`, theme red `#E30613`), so brand fidelity beats the default palette rotation. Navy + red is not a banned family. One theme: the whole page is dark navy.

**Locked type:** `Saira Semi Condensed` 600/700 display (the client's site face, matches the condensed logo) + `Saira` 400/500 body + `JetBrains Mono` 500 for part numbers, standards and spec data only. Sans throughout; no serif.

**Corner language:** all-sharp (0 radius) everywhere, like machined edges. Hairline 1px rules in `#8C96AD` at 25 percent.

Animation mode: animated-website

> **Delivery change (user decision):** Higgsfield media generation is unavailable on this account (trial: "only MCP usage on trial is available"), so no film, storyboard or generated stills could be produced. The user chose a code-built alternative: the journey is a **real-time WebGL scroll scrub** of a procedural wheel-end assembly (three.js, `src/components/hub/`). Scroll drives camera, light and the exploded view exactly as the film was planned to; posters, product shots, the blueprint and the link-preview art are offline renders of the same scene (`scripts/render-hub/`). The template's video engine is kept but unused (`src/scroll-scrub-scenes.ts` has no scenes).

## Journey (A4, single-shot)

- **Journey shape:** single-shot. One continuous scroll-driven move around one subject, rendered live in WebGL (originally planned as a 15s Kling 3.0 film).
- **Camera architecture:** A (continuous forward move; single clip, no seams).
- **World grammar (byte-identical preamble):** "Dark seamless navy-black studio (#070D1F), single cool key light from upper left, thin cool rim light, controlled red (#E30613) accent reflection, photoreal industrial product cinematography, machined steel and dark ductile cast iron, shallow haze, no text, no logos, no watermark."
- **The move:** a heavy-duty truck wheel hub emerges from darkness, a light sweep crosses the raw cast iron, the camera slowly orbits and pushes toward the machined bearing bore, then pulls back as the assembly separates along its axle axis into a clean exploded view (hub, tapered roller bearings, seal, wheel studs, brake drum), ending rim-lit and fully revealed. Start state (dark, assembled) differs from end state (lit, exploded).
- **Chapters (5) over the film:**
  1. `origin` 0 to 20%: hub emerges. "Wheel ends, engineered since 1967." Hero CTAs.
  2. `foundry` 20 to 40%: light sweep on raw iron. In-house ductile and grey iron foundry.
  3. `machining` 40 to 60%: push to the bearing bore. CNC precision.
  4. `assembly` 60 to 80%: parts separate. Bearings, seals, studs assembled, pre-adjusted.
  5. `delivered` 80 to 100%: exploded view revealed. 70+ countries, OEM and aftermarket.
- **How it enacts the spine:** scrolling forward literally takes the hub apart; scrolling back puts it together.
- **Mobile framing:** portrait screens lift the subject into the top of the frame and bank the camera 90deg as the hub opens, so the exploded stack runs top to bottom; chapter copy sits in the lower band over a shade.
- **Delivery budget:** three.js is loaded on demand (code-split); posters are WebP under 50 KB each. No video payload.
- **Cost shape:** zero generation credits.

## Section plan (after the journey)

| # | Section | Layout family |
|---|---|---|
| 0 | Journey (5 chapters) | full-bleed scroll-scrub |
| 1 | Products: seven wheel-end lines | interactive index list with cursor-follow product image |
| 2 | Process: eleven stages under one roof | pinned plate + vertical timeline with a scroll-drawn red spine |
| 3 | By the numbers | oversized stat band, 4 figures, rule-separated |
| 4 | Engineering services | asymmetric bento (5 cells, 2 with imagery/tint) |
| 5 | Certified systems | spec-sheet table (standard / scope / mono codes) |
| 6 | Closing quote request | split: copy + contact block over the final film frame |
| 7 | Footer | wordmark, contact, concept note |

Eyebrow budget: ceil(8/3) = 3. Used: products, process, closing.

## Asset plan (as built)

- Live hero: procedural hub-drum assembly (hub, gussets, 10 studs, finned drum, tapered bearings, seal, ABS ring, nut, red hub cap) with scroll-driven exploded view and engineering callouts.
- Posters: exact renders of the scene at the hero and exploded poses, desktop and portrait (`public/assets/hub/`).
- Product imagery: 6 renders from model variants (drive, trailer, steer, hub-drum, hub-rotor, pre-adjusted) plus a wireframe blueprint for custom OEM work (`public/assets/products/`, `public/assets/hub/blueprint.webp`).
- Section plate: blueprint grid pattern (CSS) on process and validation cells; no generated foundry plate.
- Icons: Phosphor light line icons (documented library fallback, since a generated set was unavailable).
- Logo: the client's own wordmark, recolored white; favicons and maskable icons cut from its "R".
- Link-preview card (1200x630) and feed cover (3:2) composed from the exploded render, Rastgar-branded.

## CTA inventory (each its own component, own interaction)

Button language (user's choice after first review): **outline buttons in machined steel** (`#c9cfd8` outline, cool white label) where a brushed-steel fill sweeps in from the left on hover, focus or tap and out to the right, turning the label Rastgar navy (`#0b1b3e`). Red is kept for small accents only.

1. **Nav "Request a quote"**: compact steel outline; red bolt-head square turns a quarter on hover.
2. **Hero "Request a quote"**: large steel outline with a steel arrow chip that inverts to navy and spins like a hub; magnetic pull toward the pointer.
3. **Hero "Explore products"**: text link with a steel underline that draws on hover.
4. **Product rows**: whole row is the link (mailto with the part line in the subject); hover slides a red index bar in from the left and swaps the floating image.
5. **Process "Request documentation"**: steel outline with four red corner ticks that close inward as the fill sweeps.
6. **Closing "Request a quote"**: circular seal; steel ring text turns while hovered and the steel-outlined core fills.
7. **Closing "Call the plant"**: tel link, a red pulse line sweeps beneath on hover.
8. **Products "Browse full catalog"**: mono text link to the client's live catalog; steel arrow lifts.

All quote and documentation CTAs open email to the client's real addresses (`sales@rastgar.com`, `info@rastgar.com`). This is a concept site, so it collects no data itself. The seal CTA is the one deliberate circle in an otherwise all-sharp system (a stamp, like a hub face).

## Anti-convergence ledger

First build in this chat; no previous identity to differ from.
