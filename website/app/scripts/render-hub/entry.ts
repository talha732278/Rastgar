/**
 * Offline render harness: bundles the live hub scene so a headless browser
 * can render the posters, product shots and link-preview art from the exact
 * same model and lighting the page uses. Run via scripts/render-hub/render.mjs.
 */
import { createHubScene, journeyState, type FrameState } from "../../src/components/hub/hub-scene";
import type { HubVariant } from "../../src/components/hub/hub-model";

interface ShotRequest {
  variant?: HubVariant;
  wireframe?: boolean;
  width: number;
  height: number;
  p?: number;
  state?: Partial<FrameState>;
}

declare global {
  interface Window {
    renderShot: (req: ShotRequest) => string;
  }
}

window.renderShot = (req) => {
  const canvas = document.createElement("canvas");
  const scene = createHubScene({
    canvas,
    preserveDrawingBuffer: true,
    variant: req.variant ?? "hub-drum",
    wireframe: req.wireframe ?? false,
  });
  scene.setSize(req.width, req.height, 1);
  scene.apply({ ...journeyState(req.p ?? 0), ...req.state });
  scene.render();
  const url = canvas.toDataURL("image/png");
  scene.dispose();
  return url;
};
