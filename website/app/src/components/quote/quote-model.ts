/**
 * Quote request model: the fields, their rules, search-param prefill and the
 * email the form composes. Nothing here talks to a server; the page turns
 * the composed request into a mailto: link to the sales inbox.
 */
import { CONTACT, PRODUCTS } from "@/components/site/content";

export type FieldName =
  | "name"
  | "company"
  | "email"
  | "phone"
  | "country"
  | "product"
  | "parts"
  | "quantity"
  | "application"
  | "message";

export type QuoteValues = Record<FieldName, string>;
export type QuoteErrors = Partial<Record<FieldName, string>>;

/** Select value for "Not sure yet"; every other value is a PRODUCTS id. */
export const UNSURE = "unsure";

export const FIELD_ORDER: FieldName[] = [
  "name",
  "company",
  "email",
  "phone",
  "country",
  "product",
  "parts",
  "quantity",
  "application",
  "message",
];

export const LABELS: Record<FieldName, string> = {
  application: "Application",
  company: "Company",
  country: "Country",
  email: "Work email",
  message: "Message",
  name: "Full name",
  parts: "Part or OEM numbers",
  phone: "Phone",
  product: "Product line",
  quantity: "Estimated quantity or annual volume",
};

export const REQUIRED: ReadonlySet<FieldName> = new Set<FieldName>(["name", "company", "email", "message"]);

/** Generous limits that still keep the composed mailto: link a sane length. */
export const LIMITS: Record<FieldName, number> = {
  application: 200,
  company: 120,
  country: 80,
  email: 160,
  message: 1200,
  name: 100,
  parts: 500,
  phone: 40,
  product: 40,
  quantity: 120,
};

export const MESSAGE_MIN = 10;

export const fieldId = (name: FieldName) => `quote-${name}`;

export const emptyValues = (): QuoteValues => ({
  application: "",
  company: "",
  country: "",
  email: "",
  message: "",
  name: "",
  parts: "",
  phone: "",
  product: UNSURE,
  quantity: "",
});

/* ------------------------------------------------------------- search */

export interface QuoteSearch {
  /** A PRODUCTS id, e.g. "drive". */
  product?: string;
  /** A Rastgar or OEM part number, e.g. "R 23.01". */
  part?: string;
}

const PRODUCT_IDS = new Set(PRODUCTS.map((line) => line.id));

/**
 * Keeps only a known product line id and a plausible part number; anything
 * else is dropped. Both keys are always returned (undefined when dropped)
 * because the router merges validated search over the raw query string.
 */
export function parseQuoteSearch(search: Record<string, unknown>): QuoteSearch {
  const result: QuoteSearch = { part: undefined, product: undefined };

  const product = typeof search.product === "string" ? search.product.trim().toLowerCase() : "";
  if (PRODUCT_IDS.has(product)) result.product = product;

  const rawPart =
    typeof search.part === "string" || typeof search.part === "number" ? String(search.part) : "";
  const part = rawPart
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (part && part.length <= 60 && /[a-z0-9]/i.test(part)) result.part = part;

  return result;
}

/** Initial values for a visit that arrived with a product line or part number. */
export function prefilledValues({ product, part }: QuoteSearch): QuoteValues {
  const values = emptyValues();
  if (product) values.product = product;
  if (part) values.parts = part;
  return values;
}

/** Adds a part number to the parts field unless it is already listed. */
export function withPart(parts: string, part: string): string {
  const lines = parts.split("\n").map((line) => line.trim());
  if (lines.some((line) => line.toLowerCase() === part.toLowerCase())) return parts;
  return parts.trim() ? `${parts.replace(/\s+$/, "")}\n${part}` : part;
}

export function productName(id: string): string {
  return PRODUCTS.find((line) => line.id === id)?.name ?? "Not sure yet";
}

/* --------------------------------------------------------- validation */

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_CHARS = /^[0-9+()./\s-]+$/;

export function validateField(name: FieldName, raw: string): string | undefined {
  const value = raw.trim();
  if (REQUIRED.has(name) && !value) {
    switch (name) {
      case "name":
        return "Enter your full name.";
      case "company":
        return "Enter your company name.";
      case "email":
        return "Enter your work email address.";
      default:
        return "Tell us briefly what you need.";
    }
  }
  if (value.length > LIMITS[name]) return `Keep this under ${LIMITS[name]} characters.`;

  switch (name) {
    case "name":
      return value.length < 2 ? "Enter your full name." : undefined;
    case "email":
      return EMAIL.test(value) ? undefined : "Enter an email address like name@company.com.";
    case "phone": {
      if (!value) return undefined;
      const digits = value.replace(/\D/g, "").length;
      if (!PHONE_CHARS.test(value) || digits < 7 || digits > 16) {
        return "Enter a phone number using digits, spaces and +, or leave it empty.";
      }
      return undefined;
    }
    case "product":
      return value === UNSURE || PRODUCT_IDS.has(value) ? undefined : "Choose a product line.";
    case "message":
      return value.length < MESSAGE_MIN
        ? `Add a few more words, at least ${MESSAGE_MIN} characters.`
        : undefined;
    default:
      return undefined;
  }
}

export function validateAll(values: QuoteValues): QuoteErrors {
  const errors: QuoteErrors = {};
  for (const name of FIELD_ORDER) {
    const error = validateField(name, values[name]);
    if (error) errors[name] = error;
  }
  return errors;
}

/* ------------------------------------------------------------ compose */

export interface SummaryRow {
  label: string;
  value: string;
  multiline?: boolean;
}

export interface ComposedRequest {
  subject: string;
  /** Plain text with \n line breaks. */
  body: string;
  /** mailto: link to the sales inbox with subject and body. */
  href: string;
  /** Subject, recipient and body as one block for the clipboard. */
  clipboard: string;
  rows: SummaryRow[];
}

const NOT_GIVEN = "Not provided";

const clean = (value: string) => value.trim().replace(/\r\n?/g, "\n");

export function summaryRows(values: QuoteValues): SummaryRow[] {
  const show = (value: string) => clean(value) || NOT_GIVEN;
  return [
    { label: LABELS.name, value: show(values.name) },
    { label: LABELS.company, value: show(values.company) },
    { label: LABELS.email, value: show(values.email) },
    { label: LABELS.phone, value: show(values.phone) },
    { label: LABELS.country, value: show(values.country) },
    { label: LABELS.product, value: productName(values.product) },
    { label: LABELS.parts, multiline: true, value: show(values.parts) },
    { label: LABELS.quantity, value: show(values.quantity) },
    { label: LABELS.application, value: show(values.application) },
    { label: LABELS.message, multiline: true, value: show(values.message) },
  ];
}

/** "Label: value", or the label on its own line above an indented block. */
function line(label: string, value: string) {
  if (!value.includes("\n")) return `${label}: ${value}`;
  const block = value
    .split("\n")
    .map((part) => `  ${part}`)
    .join("\n");
  return `${label}:\n${block}`;
}

export function composeRequest(values: QuoteValues): ComposedRequest {
  const company = clean(values.company).replace(/\s+/g, " ");
  const firstPart = clean(values.parts).split("\n")[0]?.trim() ?? "";
  const topic =
    values.product !== UNSURE ? productName(values.product) : firstPart ? firstPart : "";
  const subject = topic ? `Quote request: ${company}, ${topic}` : `Quote request: ${company}`;

  const rows = summaryRows(values);
  const get = (label: string) => rows.find((row) => row.label === label)?.value ?? NOT_GIVEN;
  const message = clean(values.message);

  const body = [
    "Hello Rastgar sales team,",
    "",
    "Please quote the following.",
    "",
    "CONTACT",
    line(LABELS.name, get(LABELS.name)),
    line(LABELS.company, get(LABELS.company)),
    line(LABELS.email, get(LABELS.email)),
    line(LABELS.phone, get(LABELS.phone)),
    line(LABELS.country, get(LABELS.country)),
    "",
    "REQUIREMENT",
    line(LABELS.product, get(LABELS.product)),
    line(LABELS.parts, get(LABELS.parts)),
    line(LABELS.quantity, get(LABELS.quantity)),
    line(LABELS.application, get(LABELS.application)),
    "",
    "MESSAGE",
    message,
    "",
    "Drawings: attached to this email if available.",
  ].join("\n");

  // RFC 6068: line breaks in a mailto body are CRLF.
  const href = `mailto:${CONTACT.salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body.replace(/\n/g, "\r\n")
  )}`;

  const clipboard = [`To: ${CONTACT.salesEmail}`, `Subject: ${subject}`, "", body].join("\n");

  return { body, clipboard, href, rows, subject };
}
