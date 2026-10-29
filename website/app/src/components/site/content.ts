/**
 * Every visible string on the page. Facts (product lines, process stages,
 * certifications, contact details) come from Rastgar Engineering's public
 * site; the copy itself is written for this redesign.
 */
import type { CalloutId } from "@/components/hub/hub-model";

export const CONTACT = {
  address: [
    "Rastgar Engineering Company (Pvt) Ltd.",
    "307, Street 3, Sector I-9/3, Industrial Area",
    "Islamabad 44790, Pakistan",
  ],
  catalogUrl: "/catalog",
  hours: "Monday to Saturday, 8:00 to 17:00 PKT",
  phoneDisplay: "+92 111 333 111",
  phoneHref: "tel:+92111333111",
  salesEmail: "sales@rastgar.com",
  supportEmail: "info@rastgar.com",
};

/** Link to the on-site quote request page, optionally preselecting a product line id or a part number. */
export const quoteHref = (product?: string, part?: string) => {
  const params = new URLSearchParams();
  if (product) params.set("product", product);
  if (part) params.set("part", part);
  const query = params.toString();
  return query ? `/quote?${query}` : "/quote";
};

export const docsHref = `mailto:${CONTACT.supportEmail}?subject=${encodeURIComponent(
  "Process and quality documentation"
)}`;

export interface Chapter {
  id: string;
  label: string;
  title: string;
  body: string;
  tags?: string[];
  align: "left" | "right" | "bottom";
}

export const CHAPTERS: Chapter[] = [
  {
    align: "left",
    body: "Hubs, drums and line-ready wheel ends for trucks, trailers and buses, cast, machined and assembled on one campus in Islamabad.",
    id: "origin",
    label: "Origin",
    title: "Wheel ends since 1967.",
  },
  {
    align: "right",
    body: "Our own foundry melts grey and ductile iron under spectrometer control, so every hub starts with chemistry we can prove.",
    id: "foundry",
    label: "Foundry",
    tags: ["Ductile iron", "Grey iron", "Casting simulation"],
    title: "It starts as molten iron.",
  },
  {
    align: "left",
    body: "Multi-axis CNC cells cut bearing seats, pilots and flange faces. These are the tolerances that decide how long a wheel end lives.",
    id: "machining",
    label: "Machining",
    tags: ["CNC machining", "100% gauging"],
    title: "Machined where it matters.",
  },
  {
    align: "right",
    body: "Bearings, seals, studs and ABS rings go in on our own lines, so your plant installs a finished wheel end, not a kit.",
    id: "assembly",
    label: "Assembly",
    tags: ["Pre-adjusted", "PPAP ready"],
    title: "Assembled before it ships.",
  },
  {
    align: "bottom",
    body: "Every layer of this hub is made, checked and traced inside one campus, then shipped to OEM and aftermarket customers in more than 70 countries.",
    id: "delivered",
    label: "Delivered",
    tags: ["IATF 16949", "70+ countries"],
    title: "Taken apart. Nothing to hide.",
  },
];

export const CALLOUTS: { id: CalloutId; label: string; detail: string; priority: 1 | 2 }[] = [
  { detail: "Inboard lip seal", id: "seal", label: "Oil seal", priority: 2 },
  { detail: "Tapered roller", id: "inner-bearing", label: "Inner bearing", priority: 1 },
  { detail: "Sensor ring", id: "abs", label: "ABS tone ring", priority: 2 },
  { detail: "Ductile iron, CNC faced", id: "hub", label: "Wheel hub", priority: 1 },
  { detail: "Pressed, 10 per hub", id: "studs", label: "Wheel studs", priority: 2 },
  { detail: "Grey iron, finned", id: "drum", label: "Brake drum", priority: 1 },
  { detail: "Tapered roller", id: "outer-bearing", label: "Outer bearing", priority: 2 },
  { detail: "Sealed, bolted", id: "cap", label: "Hub cap", priority: 1 },
];

export interface ProductLine {
  id: string;
  name: string;
  body: string;
  specs: string[];
  image: string;
  imageAlt: string;
}

export const PRODUCTS: ProductLine[] = [
  {
    body: "For driven axles that carry full torque and load, cast in ductile iron and machined for long bearing life.",
    id: "drive",
    image: "/assets/products/drive-axle-hub.webp",
    imageAlt: "Drive axle wheel hub with axle-shaft flange and ten wheel studs",
    name: "Drive axle hubs",
    specs: ["Ductile iron", "Drive"],
  },
  {
    body: "Built for sustained highway loads on trailer axles, in drum and disc configurations.",
    id: "trailer",
    image: "/assets/products/trailer-hub.webp",
    imageAlt: "Trailer wheel hub with ABS tone ring and red hub cap",
    name: "Trailer wheel hubs",
    specs: ["Drum or disc", "Trailer"],
  },
  {
    body: "Tight-tolerance hubs for steer positions, where precision is a safety feature.",
    id: "steer",
    image: "/assets/products/steering-axle-hub.webp",
    imageAlt: "Steering axle wheel hub seen from the outboard face",
    name: "Steering axle hubs",
    specs: ["Steer axle", "Safety critical"],
  },
  {
    body: "Hub and drum supplied as one balanced unit, ready to bolt on at the line.",
    id: "hub-drum",
    image: "/assets/products/hub-drum-assembly.webp",
    imageAlt: "Hub and finned brake drum assembly",
    name: "Hub and drum assemblies",
    specs: ["Balanced", "Line ready"],
  },
  {
    body: "Integrated hub and vented rotor sets for air-disc wheel ends.",
    id: "hub-rotor",
    image: "/assets/products/hub-rotor-assembly.webp",
    imageAlt: "Hub and vented disc rotor assembly",
    name: "Hub and rotor assemblies",
    specs: ["Air disc", "Vented rotor"],
  },
  {
    body: "Bearings set at our plant, so end play is right the first time on your assembly line.",
    id: "enduraset",
    image: "/assets/products/preadjusted-assembly.webp",
    imageAlt: "Exploded pre-adjusted hub assembly showing bearings, seal, nut and cap",
    name: "Enduraset pre-adjusted hubs",
    specs: ["Pre-adjusted", "Faster install"],
  },
  {
    body: "Wheel-end components engineered to your drawing, validated, documented and supplied to program schedules.",
    id: "custom",
    image: "/assets/hub/blueprint.webp",
    imageAlt: "Line drawing of an exploded wheel-end assembly",
    name: "Custom OEM components",
    specs: ["Your drawing", "PPAP"],
  },
];

export const CATALOG_EXTRAS =
  "Also in the catalog: brake drums, hub bearings, ABS rings, wheel bolts, hub caps, steering knuckles and flywheels.";

export interface ProcessStep {
  title: string;
  body: string;
  icon:
    | "simulation"
    | "pattern"
    | "foundry"
    | "moulding"
    | "lab"
    | "cnc"
    | "finishing"
    | "assembly"
    | "inspection"
    | "packaging"
    | "distribution";
}

export const PROCESS: ProcessStep[] = [
  { body: "Solidification is modelled before any metal is poured.", icon: "simulation", title: "Casting simulation" },
  { body: "OEM drawings become production tooling in our own pattern shop.", icon: "pattern", title: "Pattern design" },
  { body: "Grey and ductile iron melted under tight metallurgical control.", icon: "foundry", title: "Ductile iron foundry" },
  { body: "Automated high-pressure lines for consistent, sound castings.", icon: "moulding", title: "High-pressure moulding" },
  { body: "Spectrometry checks the chemistry of every heat.", icon: "lab", title: "Metallurgical lab" },
  { body: "Multi-axis centres hold tight tolerances on every critical feature.", icon: "cnc", title: "CNC machining" },
  { body: "Shot blasting, phosphating and coatings against corrosion.", icon: "finishing", title: "Surface finishing" },
  { body: "Bearings, seals and studs fitted into line-ready wheel ends.", icon: "assembly", title: "Assembly lines" },
  { body: "Safety-critical features gauged, with full traceability.", icon: "inspection", title: "Inspection and records" },
  { body: "Export-grade packing built for each destination.", icon: "packaging", title: "Packaging" },
  { body: "Just-in-time and sequenced delivery to OEM lines.", icon: "distribution", title: "Global distribution" },
];

export const FOUNDED = 1967;

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export const statsFor = (year: number): Stat[] => [
  { label: "years focused on wheel ends", value: year - FOUNDED },
  { label: "countries supplied", suffix: "+", value: 70 },
  { label: "production stages in-house", value: PROCESS.length },
  { label: "certified management systems", value: 4 },
];

export interface Service {
  id: string;
  title: string;
  body: string;
  icon: "drawing" | "sample" | "fea" | "prototype" | "validation";
}

export const SERVICES: Service[] = [
  {
    body: "We develop wheel ends to your specification and back them with full PPAP packages for tier-1 programs.",
    icon: "drawing",
    id: "oem",
    title: "Built to your OEM design",
  },
  {
    body: "Exact form, fit and function recreated from a physical sample.",
    icon: "sample",
    id: "reverse",
    title: "Reverse engineering",
  },
  {
    body: "Strength, fatigue and solidification checked before tooling is cut.",
    icon: "fea",
    id: "fea",
    title: "FEA and casting simulation",
  },
  {
    body: "Quick sample and tooling loops that shorten development.",
    icon: "prototype",
    id: "prototype",
    title: "Rapid prototyping",
  },
  {
    body: "Dimensional and performance sign-off against your requirements.",
    icon: "validation",
    id: "validation",
    title: "Technical validation",
  },
];

export const CERTIFICATIONS: { code: string; scope: string }[] = [
  { code: "IATF 16949:2016", scope: "Automotive quality management for OEM supply" },
  { code: "ISO 9001:2015", scope: "Quality management across casting, machining and assembly" },
  { code: "ISO 14001:2015", scope: "Environmental management for foundry operations" },
  { code: "ISO 45001:2018", scope: "Occupational health and safety across the plant" },
  { code: "SA8000 (RINA)", scope: "Social accountability and fair labour practice" },
  { code: "UN Global Compact", scope: "Participant, committed to the Ten Principles" },
  { code: "EFP", scope: "Employers' Federation of Pakistan certification" },
];
