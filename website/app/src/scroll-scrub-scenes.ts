/**
 * Scene data for the template's video scroll-scrub engine.
 *
 * This build does not use the video engine: the journey is rendered live in
 * WebGL by `src/components/hub/hub-stage.tsx` (generated film was unavailable
 * for this account). The theme below mirrors the brand tokens so the engine
 * stays consistent if a film is added later; the scene list is intentionally
 * empty until real clips and their exact first-frame posters exist.
 */
import type {
  ScrollScrubScene,
  ScrollScrubTheme,
} from "@/components/scroll-scrub/scroll-scrub";

/** Brand tokens for the journey layer (see app/design-brief.md). */
export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#e30613",
  background: "#070d1f",
  ink: "#eef1f6",
  muted: "#8c96ad",
};

export const scrollScrubScenes: ScrollScrubScene[] = [];
