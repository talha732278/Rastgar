import { createFileRoute } from "@tanstack/react-router";

import { HubStage } from "@/components/hub/hub-stage";
import { HeroExplore, HeroQuote } from "@/components/site/ctas";
import {
  Certifications,
  Closing,
  Numbers,
  Process,
  Products,
  Services,
} from "@/components/site/sections";

export const Route = createFileRoute("/_site/")({
  // No title/description here on purpose: the home page inherits the site's
  // page metadata from the root route (app-meta.json).
  component: Index,
});

// The journey is the spine of the home page: scroll takes a Rastgar hub apart
// while each chapter names the in-house capability behind the part on screen.
// The shared frame (background, nav, footer) comes from the _site layout.
function Index() {
  return (
    <>
      <HubStage
        heroActions={
          <>
            <HeroQuote />
            <HeroExplore />
          </>
        }
      />
      <Products />
      <Process />
      <Numbers />
      <Services />
      <Certifications />
      <Closing />
    </>
  );
}
