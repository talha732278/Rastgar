/**
 * The on-site quote request page.
 *
 * Left: what happens after you send, and the direct contacts. Right: the
 * request form in a glass panel. Submitting validates inline, then composes
 * an email to the sales inbox and opens it through a mailto: link; the panel
 * switches to a summary with a copy button and a plain fallback address.
 * Nothing is stored and nothing is posted anywhere: before hydration the
 * form itself falls back to a mailto: action, never to this site's server.
 */
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent, ReactNode } from "react";
import {
  CaretDown,
  Check,
  Copy,
  EnvelopeSimple,
  LockSimple,
  MapPin,
  Paperclip,
  PencilSimple,
  Phone,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { CONTACT, PRODUCTS } from "@/components/site/content";
import { scrollToY } from "@/components/site/smooth-scroll";

import { ArrowGlyph, GlassButton, GlassLink } from "./quote-glass";
import {
  FIELD_ORDER,
  LABELS,
  LIMITS,
  REQUIRED,
  UNSURE,
  composeRequest,
  fieldId,
  prefilledValues,
  productName,
  validateAll,
  validateField,
  withPart,
} from "./quote-model";
import type { ComposedRequest, FieldName, QuoteErrors, QuoteSearch, QuoteValues } from "./quote-model";

import "./quote.css";

const STEPS = [
  {
    body: "This form opens an email to our sales team with your request filled in. Attach drawings there.",
    title: "Send your details",
  },
  {
    body: "An engineer checks the part, material and volume against your application.",
    title: "Engineering review",
  },
  {
    body: "We reply within one business day, with a quotation or the questions we need answered.",
    title: "Quotation",
  },
];

/** Keeps a field clear of the fixed nav when it is scrolled to. */
const NAV_CLEARANCE = 120;

function revealElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.top >= NAV_CLEARANCE - 24 && rect.bottom <= window.innerHeight - 24) return;
  scrollToY(Math.max(0, window.scrollY + rect.top - NAV_CLEARANCE));
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection fallback.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function openMail(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* -------------------------------------------------------------- fields */

interface FieldShellProps {
  name: FieldName;
  hint?: string;
  error?: string;
  full?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}

function FieldShell({ name, hint, error, full, aside, children }: FieldShellProps) {
  const id = fieldId(name);
  return (
    <div className={`qfield${full ? " qfield--full" : ""}`} data-invalid={error ? "true" : undefined}>
      <div className="qfield__top">
        <label className="qfield__label" htmlFor={id}>
          {LABELS[name]}
          {REQUIRED.has(name) ? (
            <span aria-hidden="true" className="qfield__req">
              *
            </span>
          ) : null}
        </label>
        {aside}
      </div>
      {children}
      {hint ? (
        <p className="qfield__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="qfield__error" id={`${id}-error`}>
          <WarningCircle aria-hidden="true" size={16} weight="bold" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (name: FieldName, hint: boolean, error: boolean) => {
  const id = fieldId(name);
  const ids = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
};

/* ---------------------------------------------------------------- page */

type QuotePageProps = QuoteSearch;

export function QuotePage({ product, part }: QuotePageProps) {
  const [values, setValues] = useState<QuoteValues>(() => prefilledValues({ part, product }));
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [problem, setProblem] = useState("");
  const [composed, setComposed] = useState<ComposedRequest | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const panelRef = useRef<HTMLDivElement>(null);
  const doneTitleRef = useRef<HTMLHeadingElement>(null);
  const formTitleRef = useRef<HTMLHeadingElement>(null);
  const focusTarget = useRef<"done" | "form" | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const titleId = useId();

  // Arriving again from another "Request a quote" link while on this page.
  useEffect(() => {
    if (!product && !part) return;
    setValues((current) => ({
      ...current,
      ...(product ? { product } : {}),
      ...(part ? { parts: withPart(current.parts, part) } : {}),
    }));
  }, [product, part]);

  // Move focus to the heading of whichever panel state just appeared.
  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = null;
    const heading = target === "done" ? doneTitleRef.current : formTitleRef.current;
    heading?.focus({ preventScroll: true });
    if (panelRef.current) revealElement(panelRef.current);
  }, [composed]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const update = (name: FieldName) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [name]: value }));
    // Once a field shows an error, re-check it as the visitor fixes it.
    if (errors[name] || attempted) {
      setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
    }
  };

  const check = (name: FieldName) => (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Do not nag about empty fields on the way through; submit catches those.
    if (!event.target.value.trim() && !attempted) return;
    setErrors((current) => ({ ...current, [name]: validateField(name, event.target.value) }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    const found = validateAll(values);
    setErrors(found);
    const invalid = FIELD_ORDER.filter((name) => found[name]);
    if (invalid.length > 0) {
      setProblem(
        invalid.length === 1
          ? "One field needs attention before we can compose your email."
          : `${invalid.length} fields need attention before we can compose your email.`
      );
      const first = document.getElementById(fieldId(invalid[0]));
      if (first) {
        first.focus({ preventScroll: true });
        revealElement(first);
      }
      return;
    }
    setProblem("");
    const request = composeRequest(values);
    openMail(request.href);
    focusTarget.current = "done";
    setCopyState("idle");
    setComposed(request);
  };

  const onEdit = () => {
    focusTarget.current = "form";
    setComposed(null);
  };

  const onCopy = async () => {
    if (!composed) return;
    const ok = await copyText(composed.clipboard);
    setCopyState(ok ? "copied" : "failed");
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 2600);
  };

  const inputProps = (name: FieldName, hint = false) => ({
    "aria-describedby": describedBy(name, hint, Boolean(errors[name])),
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-required": REQUIRED.has(name) ? (true as const) : undefined,
    id: fieldId(name),
    maxLength: LIMITS[name],
    name,
    onBlur: check(name),
    onChange: update(name),
    value: values[name],
  });

  const prefilled = [
    product ? productName(product) : "",
    part ?? "",
  ].filter(Boolean);

  return (
    <section aria-labelledby={titleId} className="quote">
      <div className="shell quote__grid">
        <div className="quote__intro">
          <p className="eyebrow">Quote request</p>
          <h1 className="quote__title" id={titleId}>
            Request a quote
          </h1>
          <p className="quote__lede">
            Tell us the part, the volume and where it runs. An engineer prices it for your application.
          </p>

          <div className="quote__next">
            <h2 className="quote__label">What happens next</h2>
            <ol className="qsteps">
              {STEPS.map((step, index) => (
                <li className="qstep" key={step.title}>
                  <span aria-hidden="true" className="qstep__num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="qstep__title">{step.title}</h3>
                    <p className="qstep__body">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="qpanel" ref={panelRef}>
          {composed ? (
            <div className="qdone">
              <span aria-hidden="true" className="qdone__mark">
                <Check size={26} weight="bold" />
              </span>
              <h2 className="qdone__title" ref={doneTitleRef} tabIndex={-1}>
                Finish in your email app
              </h2>
              <p className="qdone__lede">
                A new email to <strong>{CONTACT.salesEmail}</strong> has your request filled in. Attach any
                drawings, then press send. Nothing has been sent yet.
              </p>

              <div className="qdone__summary">
                <p className="qdone__subject">
                  <span className="quote__label">Subject</span>
                  <span>{composed.subject}</span>
                </p>
                <dl className="qdone__rows">
                  {composed.rows.map((row) => (
                    <div className={row.multiline ? "qdone__row qdone__row--wide" : "qdone__row"} key={row.label}>
                      <dt>{row.label}</dt>
                      <dd data-empty={row.value === "Not provided" ? "true" : undefined}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="qdone__actions">
                <GlassButton
                  icon={copyState === "copied" ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
                  onClick={onCopy}
                  tone="clear"
                >
                  {copyState === "copied" ? "Copied" : "Copy request"}
                </GlassButton>
                <GlassLink href={composed.href} icon={<EnvelopeSimple size={18} weight="bold" />} tone="clear">
                  Open email again
                </GlassLink>
                <button className="qlink" onClick={onEdit} type="button">
                  <PencilSimple aria-hidden="true" size={16} weight="bold" />
                  Edit request
                </button>
              </div>
              <p aria-live="polite" className="qdone__status" role="status">
                {copyState === "copied"
                  ? "Request copied. Paste it into any email to us."
                  : copyState === "failed"
                    ? "Copy did not work in this browser. Select the summary above instead."
                    : ""}
              </p>

              <p className="qdone__fallback">
                Email didn&rsquo;t open? Write to <a href={`mailto:${CONTACT.salesEmail}`}>{CONTACT.salesEmail}</a>
              </p>
            </div>
          ) : (
            <form
              action={`mailto:${CONTACT.salesEmail}`}
              aria-labelledby={`${titleId}-form`}
              className="qform"
              encType="text/plain"
              method="post"
              noValidate
              onSubmit={onSubmit}
            >
              <div className="qform__head">
                <h2 className="qform__title" id={`${titleId}-form`} ref={formTitleRef} tabIndex={-1}>
                  Your request
                </h2>
                <p className="qform__required">
                  <span aria-hidden="true" className="qfield__req">
                    *
                  </span>{" "}
                  Required
                </p>
              </div>

              {prefilled.length > 0 ? (
                <p className="qform__prefill">
                  <span className="qform__prefill-label">Prefilled</span>
                  {prefilled.map((item) => (
                    <span className="qchip" key={item}>
                      {item}
                    </span>
                  ))}
                </p>
              ) : null}

              <fieldset className="qset">
                <legend className="qset__legend">
                  <span aria-hidden="true">01</span> Contact
                </legend>
                <div className="qset__grid">
                  <FieldShell error={errors.name} name="name">
                    <input autoComplete="name" className="qinput" type="text" {...inputProps("name")} />
                  </FieldShell>
                  <FieldShell error={errors.company} name="company">
                    <input autoComplete="organization" className="qinput" type="text" {...inputProps("company")} />
                  </FieldShell>
                  <FieldShell error={errors.email} name="email">
                    <input
                      autoCapitalize="off"
                      autoComplete="email"
                      className="qinput"
                      inputMode="email"
                      spellCheck={false}
                      type="email"
                      {...inputProps("email")}
                    />
                  </FieldShell>
                  <FieldShell error={errors.phone} name="phone">
                    <input autoComplete="tel" className="qinput" inputMode="tel" type="tel" {...inputProps("phone")} />
                  </FieldShell>
                  <FieldShell error={errors.country} full name="country">
                    <input autoComplete="country-name" className="qinput" type="text" {...inputProps("country")} />
                  </FieldShell>
                </div>
              </fieldset>

              <fieldset className="qset">
                <legend className="qset__legend">
                  <span aria-hidden="true">02</span> Requirement
                </legend>
                <div className="qset__grid">
                  <FieldShell error={errors.product} full name="product">
                    <div className="qselect">
                      <select autoComplete="off" className="qinput qinput--select" {...inputProps("product")}>
                        {PRODUCTS.map((line) => (
                          <option key={line.id} value={line.id}>
                            {line.name}
                          </option>
                        ))}
                        <option value={UNSURE}>Not sure yet</option>
                      </select>
                      <CaretDown aria-hidden="true" className="qselect__caret" size={18} weight="bold" />
                    </div>
                  </FieldShell>
                  <FieldShell
                    error={errors.parts}
                    full
                    hint="Rastgar part numbers, OEM numbers or both, one per line."
                    name="parts"
                  >
                    <textarea
                      autoComplete="off"
                      className="qinput qinput--area qinput--parts"
                      rows={3}
                      spellCheck={false}
                      {...inputProps("parts", true)}
                    />
                  </FieldShell>
                  <FieldShell error={errors.quantity} hint="For example 400 pieces, or 6,000 a year." name="quantity">
                    <input autoComplete="off" className="qinput" type="text" {...inputProps("quantity", true)} />
                  </FieldShell>
                  <FieldShell error={errors.application} hint="Vehicle, axle or program." name="application">
                    <input autoComplete="off" className="qinput" type="text" {...inputProps("application", true)} />
                  </FieldShell>
                  <FieldShell
                    aside={
                      <span aria-hidden="true" className="qfield__count">
                        {values.message.length} / {LIMITS.message}
                      </span>
                    }
                    error={errors.message}
                    full
                    hint="What you need, target dates, and anything we should know about fit or finish."
                    name="message"
                  >
                    <textarea
                      autoComplete="off"
                      className="qinput qinput--area"
                      rows={5}
                      {...inputProps("message", true)}
                    />
                  </FieldShell>
                </div>
              </fieldset>

              <div className="qform__foot">
                <GlassButton bead={<ArrowGlyph />} className="qform__submit" tone="primary" type="submit">
                  Send by email
                </GlassButton>
                <ul className="qform__notes">
                  <li>
                    <Paperclip aria-hidden="true" size={16} weight="bold" />
                    <span>Sending opens your email app with this request filled in, so you can attach drawings.</span>
                  </li>
                  <li>
                    <LockSimple aria-hidden="true" size={16} weight="bold" />
                    <span>Nothing is stored or sent from this page.</span>
                  </li>
                </ul>
                <p aria-live="polite" className="qform__problem" role="status">
                  {problem ? (
                    <>
                      <WarningCircle aria-hidden="true" size={16} weight="bold" />
                      <span>{problem}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </form>
          )}
        </div>

        <aside aria-label="Direct contacts" className="qcontacts">
          <h2 className="quote__label">Direct contacts</h2>
          <dl className="qcontacts__list">
            <div className="qcontacts__item">
              <dt>
                <EnvelopeSimple aria-hidden="true" size={18} weight="bold" />
                Sales
              </dt>
              <dd>
                <a href={`mailto:${CONTACT.salesEmail}`}>{CONTACT.salesEmail}</a>
              </dd>
            </div>
            <div className="qcontacts__item">
              <dt>
                <Phone aria-hidden="true" size={18} weight="bold" />
                Phone
              </dt>
              <dd>
                <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a>
                <span className="qcontacts__meta">{CONTACT.hours}</span>
              </dd>
            </div>
            <div className="qcontacts__item">
              <dt>
                <MapPin aria-hidden="true" size={18} weight="bold" />
                Plant
              </dt>
              <dd>
                <address>
                  {CONTACT.address.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
