import { createFileRoute } from "@tanstack/react-router";

import { MediaPage } from "@/components/media/media-page";

const TITLE = "Media | Rastgar Engineering";
const DESCRIPTION =
  "News from Rastgar Engineering: awards, partner and student visits, training, trade shows, a photo gallery and a press kit.";

export const Route = createFileRoute("/_site/media")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MediaPage,
});
