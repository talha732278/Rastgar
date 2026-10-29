/**
 * Media page content. Facts (dates, places, stands, events) come from
 * Rastgar Engineering's own media page; the copy is written for this
 * redesign. Every photo is the client's own, downloaded from rastgar.com and
 * resized into /assets/media. Individual people are never named.
 */

export type NewsCategory = "Awards" | "Partnerships" | "Safety" | "Community" | "Leadership";

export interface Photo {
  /** Full-size image, at most 1600px wide. */
  src: string;
  /** 720px-wide version for grids and cards. */
  thumb: string;
  width: number;
  height: number;
  alt: string;
}

export interface NewsItem {
  id: string;
  category: NewsCategory;
  /** Display date, as the client publishes it. */
  date: string;
  /** Machine-readable date for <time>. */
  dateTime: string;
  title: string;
  body: string;
  photo: Photo;
}

const photo = (name: string, width: number, height: number, alt: string): Photo => ({
  alt,
  height,
  src: `/assets/media/${name}.webp`,
  thumb: `/assets/media/${name}-sm.webp`,
  width,
});

export const NEWS: NewsItem[] = [
  {
    body: "Honda Atlas Cars Pakistan presented Rastgar Engineering with its Best Quality Achievement Award at the Honda Atlas Vendors Convention 2025.",
    category: "Awards",
    date: "2025",
    dateTime: "2025",
    id: "honda-quality-award",
    photo: photo(
      "news-honda-award-2025",
      1274,
      849,
      "Award handover on stage at the Honda Atlas Cars Pakistan Vendors Convention 2025, the crystal trophy held between two men in suits"
    ),
    title: "Best Quality Achievement Award from Honda Atlas",
  },
  {
    body: "Senior leaders from HINO Motors Japan and HINO Pakistan toured our manufacturing facilities and saw where we build axle-end assemblies for HINO.",
    category: "Partnerships",
    date: "August 2025",
    dateTime: "2025-08",
    id: "hino-visit",
    photo: photo(
      "news-hino-visit-2025",
      1280,
      960,
      "HINO Motors Japan and HINO Pakistan visitors standing with the Rastgar team in front of the Rastgar Engineering sign"
    ),
    title: "HINO leadership visits the plant",
  },
  {
    body: "Managers and workers took part in hands-on fire safety training on site.",
    category: "Safety",
    date: "January 2025",
    dateTime: "2025-01",
    id: "fire-safety-training",
    photo: photo(
      "news-fire-safety-2025",
      822,
      548,
      "Two Rastgar team members in orange safety vests using a fire extinguisher during training"
    ),
    title: "Fire safety training for every shift",
  },
  {
    body: "Students from International Islamic University Islamabad (IIUI) toured our foundry, machining and product development areas.",
    category: "Community",
    date: "December 2024",
    dateTime: "2024-12",
    id: "iiui-visit",
    photo: photo(
      "news-iiui-visit-2024",
      1400,
      933,
      "IIUI students in orange safety vests listening to a guide during their plant tour"
    ),
    title: "IIUI students tour the plant",
  },
  {
    body: "Engineering students from NUST explored our foundry, machining processes and product development workflow.",
    category: "Community",
    date: "December 2024",
    dateTime: "2024-12",
    id: "nust-visit",
    photo: photo(
      "news-nust-visit-2024",
      1400,
      933,
      "NUST engineering students in safety vests standing in front of the Rastgar sign"
    ),
    title: "NUST engineers on the shop floor",
  },
  {
    body: "Our CEO ran a strategic framework training for the management team.",
    category: "Leadership",
    date: "November 2024",
    dateTime: "2024-11",
    id: "strategy-training",
    photo: photo(
      "news-strategy-training-2024",
      1400,
      1050,
      "Rastgar management team standing around a meeting room during the strategic framework training"
    ),
    title: "Strategy training for our managers",
  },
];

export interface TradeShow {
  id: string;
  name: string;
  year: string;
  dates: string;
  /** ISO start date for <time>. */
  dateTime: string;
  place: string;
  details: string[];
  body: string;
  photo?: Photo;
}

export const SHOWS: TradeShow[] = [
  {
    body: "Our hub and wheel-end range on show for aftermarket buyers across the region.",
    dateTime: "2025-12-09",
    dates: "9 to 11 December 2025",
    details: ["World Trade Centre Dubai", "Stand 6H10"],
    id: "dubai-2025",
    name: "Automechanika Dubai",
    place: "Dubai, UAE",
    year: "2025",
  },
  {
    body: "Meeting partners from Türkiye and the wider region.",
    dateTime: "2025-06-12",
    dates: "12 to 15 June 2025",
    details: ["Istanbul Expo Center"],
    id: "istanbul-2025",
    name: "Automechanika Istanbul",
    photo: photo(
      "show-istanbul-2025",
      544,
      340,
      "Two people on the Rastgar Engineering stand at Automechanika Istanbul 2025, in front of a heavy duty wheel hub banner"
    ),
    place: "Istanbul, Türkiye",
    year: "2025",
  },
  {
    body: "Enduraset pre-adjusted wheel hubs on show for the North American aftermarket.",
    dateTime: "2024-11-05",
    dates: "5 to 7 November 2024",
    details: ["The Venetian Expo and Caesars Forum", "Stand J1620"],
    id: "aapex-2024",
    name: "AAPEX",
    photo: photo(
      "show-aapex-2024",
      1100,
      687,
      "Rastgar stand at AAPEX 2024 in Las Vegas, with an Enduraset pre-adjusted wheel hub banner and a hub on display"
    ),
    place: "Las Vegas, USA",
    year: "2024",
  },
  {
    body: "Customers and distributors from around the world, met on our stand.",
    dateTime: "2024-09-10",
    dates: "10 to 14 September 2024",
    details: ["Hall 6.2", "Booth A-66"],
    id: "frankfurt-2024",
    name: "Automechanika Frankfurt",
    photo: photo(
      "show-frankfurt-2024-b",
      1100,
      687,
      "Rastgar team members with a visitor on the stand at Automechanika Frankfurt 2024, wheel hubs on display"
    ),
    place: "Frankfurt, Germany",
    year: "2024",
  },
];

/** Earlier shows from the client's media library, newest first. */
export const SHOW_ARCHIVE: { year: string; name: string; place: string }[] = [
  { name: "Automechanika Dubai", place: "Dubai World Trade Centre, 2 to 4 October", year: "2023" },
  { name: "Automechanika Frankfurt", place: "Messe Frankfurt, Germany", year: "2022" },
  { name: "Automechanika UAE", place: "Dubai World Trade Centre", year: "2019" },
  { name: "Automechanika Shanghai", place: "Shanghai, China", year: "2019" },
  { name: "Automechanika Jakarta", place: "Jakarta, Indonesia", year: "2019" },
  { name: "Automechanika Frankfurt", place: "Frankfurt, Germany", year: "2018" },
  { name: "MIMS Automechanika Moscow", place: "Moscow, Russia, August", year: "2018" },
  { name: "Automechanika Shanghai", place: "Shanghai, China", year: "2017" },
  { name: "INAPA Jakarta", place: "Jakarta, Indonesia", year: "2017" },
  { name: "Automechanika South Africa", place: "Johannesburg, South Africa", year: "2017" },
  { name: "Automechanika Jakarta", place: "Jakarta, Indonesia", year: "2016" },
  { name: "Automechanika Shanghai", place: "Shanghai, China", year: "2014" },
];

export type GalleryGroup = "shows" | "news";

export interface GalleryItem extends Photo {
  id: string;
  group: GalleryGroup;
  caption: string;
}

const shot = (
  name: string,
  caption: string,
  alt: string,
  width = 1100,
  height = 687
): GalleryItem => ({ ...photo(name, width, height, alt), caption, group: "shows", id: name });

export const GALLERY: GalleryItem[] = [
  shot(
    "show-istanbul-2025",
    "Automechanika Istanbul 2025",
    "Two people on the Rastgar Engineering stand at Automechanika Istanbul 2025, in front of a heavy duty wheel hub banner",
    544,
    340
  ),
  shot(
    "show-aapex-2024",
    "AAPEX 2024, Las Vegas",
    "Rastgar stand at AAPEX 2024 with an Enduraset pre-adjusted wheel hub banner and a hub on display"
  ),
  shot(
    "show-frankfurt-2024",
    "Automechanika Frankfurt 2024",
    "Two men in conversation at a high table on the Rastgar stand, Automechanika Frankfurt 2024"
  ),
  shot(
    "show-frankfurt-2024-b",
    "Automechanika Frankfurt 2024",
    "Rastgar team members with a visitor on the stand, wheel hubs on display, Automechanika Frankfurt 2024"
  ),
  ...NEWS.map(
    (item): GalleryItem => ({ ...item.photo, caption: `${item.title}, ${item.date}`, group: "news", id: item.id })
  ),
  shot(
    "show-dubai-2023",
    "Automechanika Dubai 2023",
    "Four visitors with lanyards holding brochures on the Rastgar stand, Automechanika Dubai 2023"
  ),
  shot(
    "show-dubai-2023-b",
    "Automechanika Dubai 2023",
    "Rastgar team reviewing documents with visitors at Automechanika Dubai 2023"
  ),
  shot(
    "show-frankfurt-2022",
    "Automechanika Frankfurt 2022",
    "Rastgar team in conversation on the stand at Automechanika Frankfurt 2022, wheel hub graphics behind"
  ),
  shot(
    "show-dubai-2019",
    "Automechanika UAE 2019, Dubai",
    "Visitors looking at a Rastgar wheel hub on the stand at Automechanika UAE 2019 in Dubai"
  ),
  shot(
    "show-shanghai-2019",
    "Automechanika Shanghai 2019",
    "Visitors talking with the Rastgar team under a row of Rastgar banners, Automechanika Shanghai 2019",
    1440,
    900
  ),
  shot(
    "show-jakarta-2019",
    "Automechanika Jakarta 2019",
    "Meeting at a table on the Rastgar stand under a 50 Years of Manufacturing banner, Automechanika Jakarta 2019",
    1440,
    900
  ),
  shot(
    "show-moscow-2018",
    "MIMS Automechanika Moscow 2018",
    "Rastgar team showing wheel hubs to visitors at MIMS Automechanika Moscow 2018",
    1033,
    645
  ),
  shot(
    "show-frankfurt-2018",
    "Automechanika Frankfurt 2018",
    "Visitors examining Rastgar wheel hubs at Automechanika Frankfurt 2018"
  ),
  shot(
    "show-frankfurt-2018-b",
    "Automechanika Frankfurt 2018",
    "Meeting at a table on the Rastgar stand with wheel hubs on display, Automechanika Frankfurt 2018"
  ),
  shot(
    "show-shanghai-2017",
    "Automechanika Shanghai 2017",
    "Rastgar stand in the Pakistan pavilion at Automechanika Shanghai 2017",
    1440,
    900
  ),
  shot(
    "show-inapa-2017",
    "INAPA Jakarta 2017",
    "Rastgar team showing a wheel hub to visitors at INAPA Jakarta 2017"
  ),
  shot(
    "show-inapa-2017-b",
    "INAPA Jakarta 2017",
    "Visitor reviewing Rastgar wheel hubs and a catalogue at INAPA Jakarta 2017"
  ),
  shot(
    "show-south-africa-2017",
    "Automechanika South Africa 2017, Johannesburg",
    "Rastgar team and visitors lined up in front of the stand at Automechanika South Africa 2017"
  ),
  shot(
    "show-jakarta-2016",
    "Automechanika Jakarta 2016",
    "Rastgar stand in the exhibition hall at Automechanika Jakarta 2016",
    1440,
    900
  ),
  shot(
    "show-shanghai-2014",
    "Automechanika Shanghai 2014",
    "Rastgar stand beside the Pakistan flag display at Automechanika Shanghai 2014",
    1440,
    900
  ),
];

export const MEDIA_KIT = [
  {
    file: "/assets/brand/rastgar-logo-white.png",
    fileName: "rastgar-logo-white.png",
    format: "PNG, 258 x 119, white on transparent",
    id: "logo",
    title: "Rastgar logo",
  },
  {
    file: "/assets/og/rastgar-og.jpg",
    fileName: "rastgar-link-preview.jpg",
    format: "JPG, 1200 x 630",
    id: "og",
    title: "Link preview card",
  },
];
