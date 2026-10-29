import { createFileRoute } from "@tanstack/react-router";

import { QuotePage } from "@/components/quote/quote-page";
import { parseQuoteSearch } from "@/components/quote/quote-model";
import type { QuoteSearch } from "@/components/quote/quote-model";

const TITLE = "Request a quote | Rastgar Engineering";
const DESCRIPTION =
  "Ask Rastgar Engineering for a quotation on wheel hubs, hub and drum assemblies or custom wheel-end parts. Send part numbers, volumes and your application; engineers reply within one business day.";

// On-site quote request. ?product=<product line id> and ?part=<part number>
// prefill the form; unknown values are dropped by parseQuoteSearch. The form
// composes an email to the sales inbox and stores nothing.
export const Route = createFileRoute("/_site/quote")({
  validateSearch: (search: Record<string, unknown>): QuoteSearch => parseQuoteSearch(search),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: QuoteRoute,
});

function QuoteRoute() {
  // Sanitised again here: the router keeps raw keys next to validated ones.
  const { product, part } = parseQuoteSearch(Route.useSearch());
  return <QuotePage part={part} product={product} />;
}
