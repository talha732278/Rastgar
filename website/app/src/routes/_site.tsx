import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/site-shell";

// Pathless layout for every public page: one background, nav and footer that
// persist across client-side navigation between home, catalog, quote, media
// and careers.
export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  );
}
