/**
 * Edge refraction for liquid glass surfaces.
 *
 * Chromium can run an SVG filter on an element's backdrop
 * (backdrop-filter: url(#id)). We use that to bend the background near the
 * rounded edge of each glass button, the way a thick drop of glass would:
 * the center stays true, the rim samples from further inside, so whatever
 * passes behind the edge looks stretched and lensed.
 *
 * One hidden <svg> is appended to <body> the first time a glass surface
 * mounts. Each distinct surface size gets one <filter> in it with a
 * displacement map drawn for that exact size and shape (a pill or a circle),
 * shared by every surface of that size and removed when the last one
 * unmounts. Safari and Firefox do not render SVG filters in backdrop-filter,
 * so they never get the attribute and keep the plain blur glass.
 *
 * Browser only: every export is called from a React effect.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFS_ID = "rg-glass-defs";

interface FilterEntry {
  id: string;
  node: SVGFilterElement;
  users: number;
}

const filters = new Map<string, FilterEntry>();
let supported: boolean | null = null;
let serial = 0;

/** True only where SVG filters actually render inside backdrop-filter (Chromium). */
export function refractionSupported(): boolean {
  if (supported !== null) return supported;
  supported = false;
  try {
    if (typeof CSS === "undefined" || !CSS.supports("backdrop-filter", "blur(1px) url(#a)")) return false;
    const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
    const brands = nav.userAgentData?.brands;
    if (brands?.some((entry) => /chromium/i.test(entry.brand))) {
      supported = true;
    } else {
      const ua = nav.userAgent;
      supported = /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS|OPiOS/.test(ua);
    }
  } catch {
    supported = false;
  }
  return supported;
}

function defsNode(): SVGDefsElement {
  let svg = document.getElementById(DEFS_ID) as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.id = DEFS_ID;
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    // Not display:none: Chromium skips filters inside an undisplayed svg.
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    svg.appendChild(document.createElementNS(SVG_NS, "defs"));
    document.body.appendChild(svg);
  }
  let defs = svg.querySelector("defs");
  if (!defs) defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));
  return defs;
}

/**
 * Displacement map for a rounded box whose corner radius is half its short
 * side (a pill, or a circle when square). Red carries x, green carries y,
 * 128 is "no shift". Inside a band of `bezel` px along the edge the map
 * points inward, strongest at the very edge.
 */
function drawMap(width: number, height: number, bezel: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const radius = Math.min(width, height) / 2;
  const innerX = width / 2 - radius;
  const innerY = height / 2 - radius;

  for (let y = 0; y < height; y++) {
    const py = y + 0.5 - height / 2;
    const qy = Math.abs(py) - innerY;
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - width / 2;
      const qx = Math.abs(px) - innerX;
      let nx = 0;
      let ny = 0;
      let edge: number;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        edge = radius - len;
        nx = (qx / len) * Math.sign(px);
        ny = (qy / len) * Math.sign(py);
      } else if (qx > qy) {
        edge = radius - qx;
        nx = Math.sign(px);
      } else {
        edge = radius - qy;
        ny = Math.sign(py);
      }
      const t = Math.min(1, Math.max(0, 1 - edge / bezel));
      // Convex profile: flat in the middle, bending hard right at the rim.
      const m = t * t * t;
      const i = (y * width + x) * 4;
      data[i] = Math.round(128 - nx * m * 127);
      data[i + 1] = Math.round(128 - ny * m * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function acquire(width: number, height: number): FilterEntry | null {
  const key = `${width}x${height}`;
  const existing = filters.get(key);
  if (existing) {
    existing.users += 1;
    return existing;
  }
  const short = Math.min(width, height);
  const bezel = Math.max(6, Math.min(18, short * 0.3));
  const shift = Math.max(4, Math.min(12, short * 0.2));
  const map = drawMap(width, height, bezel);
  if (!map) return null;

  serial += 1;
  const id = `rg-glass-refract-${serial}`;
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.id = id;
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("primitiveUnits", "userSpaceOnUse");
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", String(width));
  filter.setAttribute("height", String(height));
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const image = document.createElementNS(SVG_NS, "feImage");
  image.setAttribute("href", map);
  image.setAttribute("x", "0");
  image.setAttribute("y", "0");
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
  image.setAttribute("preserveAspectRatio", "none");
  image.setAttribute("result", "map");

  const displace = document.createElementNS(SVG_NS, "feDisplacementMap");
  displace.setAttribute("in", "SourceGraphic");
  displace.setAttribute("in2", "map");
  displace.setAttribute("scale", String(shift * 2));
  displace.setAttribute("xChannelSelector", "R");
  displace.setAttribute("yChannelSelector", "G");

  filter.append(image, displace);
  defsNode().appendChild(filter);

  const entry: FilterEntry = { id, node: filter, users: 1 };
  filters.set(key, entry);
  return entry;
}

function release(width: number, height: number) {
  const key = `${width}x${height}`;
  const entry = filters.get(key);
  if (!entry) return;
  entry.users -= 1;
  if (entry.users <= 0) {
    entry.node.remove();
    filters.delete(key);
  }
}

/**
 * Give one glass surface edge refraction sized to its box, kept in step with
 * its size. Sets --lg-refract and [data-refract] for the CSS to pick up.
 * Returns a cleanup function. Does nothing outside Chromium.
 */
export function attachRefraction(surface: HTMLElement): () => void {
  if (!refractionSupported()) return () => {};
  let current: [number, number] | null = null;

  const update = () => {
    // Layout size, unaffected by hover lifts, squish or magnetic transforms.
    const width = Math.round(surface.offsetWidth);
    const height = Math.round(surface.offsetHeight);
    if (current && current[0] === width && current[1] === height) return;
    if (current) release(current[0], current[1]);
    current = null;
    if (width < 8 || height < 8) {
      surface.removeAttribute("data-refract");
      return;
    }
    const entry = acquire(width, height);
    if (!entry) {
      surface.removeAttribute("data-refract");
      return;
    }
    current = [width, height];
    surface.style.setProperty("--lg-refract", `url(#${entry.id})`);
    surface.setAttribute("data-refract", "");
  };

  update();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
  observer?.observe(surface);

  return () => {
    observer?.disconnect();
    if (current) release(current[0], current[1]);
    current = null;
    surface.removeAttribute("data-refract");
    surface.style.removeProperty("--lg-refract");
  };
}
