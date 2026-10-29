import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { CatalogPage } from "@/components/catalog/catalog-page";
import { parseCatalogSearch } from "@/components/catalog/catalog-model";
import type { CatalogSearch } from "@/components/catalog/catalog-model";

const TITLE = "Catalog | Rastgar Engineering";
const DESCRIPTION =
  "Search every Rastgar wheel hub, hub assembly, brake drum and wheel-end part by Rastgar part number, OEM number, brand or type, then request a quote.";

// The on-site catalog. Query, category and brand live in the URL so a
// filtered view can be shared, and the default view renders on the server.
export const Route = createFileRoute("/_site/catalog")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => parseCatalogSearch(search),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CatalogRoute,
});

function CatalogRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const onSearch = useCallback(
    (next: CatalogSearch) => {
      const clean: CatalogSearch = {};
      if (next.q) clean.q = next.q;
      if (next.category) clean.category = next.category;
      if (next.brand) clean.brand = next.brand;
      void navigate({ replace: true, resetScroll: false, search: clean });
    },
    [navigate]
  );
  return <CatalogPage onSearch={onSearch} search={search} />;
}
