import { createFileRoute } from "@tanstack/react-router";

import { CareersPage } from "@/components/careers/careers-page";

const TITLE = "Careers | Rastgar Engineering";
const DESCRIPTION =
  "Open roles at Rastgar Engineering in Islamabad: product development, operations and IT. Filter by department and experience, then apply by email.";

export const Route = createFileRoute("/_site/careers")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CareersPage,
});
