/**
 * Careers page: hero with a short "why Rastgar" block, a filterable job board
 * (department and experience level) whose cards expand as accessible
 * disclosures, and a general CV band. Applying composes an email to the
 * client's address; nothing is collected or stored here.
 */
import { useId, useMemo, useState } from "react";

import { GlassChip, GlassLink } from "@/components/media/glass-controls";
import { CONTACT } from "@/components/site/content";

import { DEPARTMENTS, JOBS, LEVELS, WHY, levelFor } from "./careers-data";
import type { Department, Job, Level } from "./careers-data";

import "./careers.css";

const APPLY_EMAIL = CONTACT.supportEmail;

function applyHref(title: string) {
  const subject = `Application: ${title}`;
  const body = [
    `Hello Rastgar team,`,
    ``,
    `I would like to apply for the ${title} role.`,
    ``,
    `Name:`,
    `Phone:`,
    `Current role:`,
    ``,
    `My CV is attached.`,
  ].join("\n");
  return `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function cvHref() {
  const body = [`Hello Rastgar team,`, ``, `Name:`, `Phone:`, `Current role:`, `Area of interest:`, ``, `My CV is attached.`].join(
    "\n"
  );
  return `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent("CV: general application")}&body=${encodeURIComponent(body)}`;
}

function MailGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6.5 9.5 12 15l5.5-5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  return (
    <section aria-labelledby="careers-title" className="cr-hero">
      <div className="shell cr-hero__inner">
        <header className="section-head cr-hero__head">
          <p className="eyebrow">Careers</p>
          <h1 className="section-title section-title--xl" id="careers-title">
            Careers that move the world's trucks
          </h1>
          <p className="section-lede">
            Join the team that designs, casts, machines and ships critical commercial vehicle parts from Islamabad to customers
            abroad.
          </p>
          <div className="cr-hero__actions">
            <GlassLink className="gx-pill gx-pill--bead-end" href="#jobs" tone="primary">
              <span>See open roles</span>
              <span aria-hidden="true" className="gx-bead gx-bead--nudge-y">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 5.5v12.5M6.5 12.5 12 18l5.5-5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
              </span>
            </GlassLink>
          </div>
        </header>
        <figure aria-hidden="true" className="cr-hero__art">
          <img alt="" decoding="async" src="/assets/hub/exploded-desktop.webp" />
        </figure>
      </div>

      <div className="shell">
        <h2 className="sr-only">Why Rastgar</h2>
        <ol className="cr-why">
          {WHY.map((point, index) => (
            <li className="cr-why__item" key={point.title}>
              <span className="cr-why__num">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="cr-why__title">{point.title}</h3>
              <p className="cr-why__body">{point.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- job board */

function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headId = useId();

  return (
    <li className="cr-job" data-open={open}>
      <h3 className="cr-job__heading" id={headId}>
        <button aria-controls={panelId} aria-expanded={open} className="cr-job__toggle" onClick={() => setOpen(!open)} type="button">
          <span className="cr-job__main">
            <span className="cr-job__dept">{job.department}</span>
            <span className="cr-job__title">{job.title}</span>
            <span className="cr-job__summary">{job.summary}</span>
          </span>
          <span className="cr-job__facts">
            <span className="cr-tag">{job.location}</span>
            <span className="cr-tag">{job.type}</span>
            <span className="cr-tag">{job.minYears}+ years</span>
            <span className="cr-tag">
              {job.positions} {job.positions === 1 ? "opening" : "openings"}
            </span>
          </span>
          <span aria-hidden="true" className="cr-job__chev">
            <Chevron />
          </span>
          <span className="sr-only">{open ? "Hide details" : "Show details"}</span>
        </button>
      </h3>

      <div aria-labelledby={headId} className="cr-job__panel" hidden={!open} id={panelId} role="region">
        <dl className="cr-job__specs">
          <div>
            <dt>Positions</dt>
            <dd>{job.positions}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>
              {job.minYears}+ years
            </dd>
          </div>
          <div>
            <dt>Education</dt>
            <dd>{job.education}</dd>
          </div>
          <div>
            <dt>Posted</dt>
            <dd>
              <time dateTime={job.postedISO}>{job.posted}</time>
            </dd>
          </div>
        </dl>

        <div className="cr-job__cols">
          <div>
            <h4 className="cr-job__label">What you will do</h4>
            <ul className="cr-list">
              {job.duties.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          {job.requirements.length ? (
            <div>
              <h4 className="cr-job__label">What you bring</h4>
              <ul className="cr-list">
                {job.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="cr-job__skills">
          <h4 className="cr-job__label">{job.skillsLabel}</h4>
          <ul className="cr-tags">
            {job.skills.map((s) => (
              <li className="cr-tag cr-tag--skill" key={s}>
                {s}
              </li>
            ))}
          </ul>
          {job.extra ? (
            <>
              <h4 className="cr-job__label">{job.extra.label}</h4>
              <ul className="cr-tags">
                {job.extra.items.map((s) => (
                  <li className="cr-tag" key={s}>
                    {s}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="cr-job__apply">
          <p className="cr-job__status">
            <span aria-hidden="true" className="cr-dot" />
            Accepting applications
          </p>
          <GlassLink
            className="gx-pill gx-pill--sm gx-pill--bead-end"
            href={applyHref(job.title)}
            label={`Apply by email for ${job.title}`}
            tone="primary"
          >
            <span>Apply by email</span>
            <span aria-hidden="true" className="gx-bead">
              <MailGlyph />
            </span>
          </GlassLink>
        </div>
      </div>
    </li>
  );
}

const matches = (job: Job, d: "all" | Department, l: "all" | Level) =>
  (d === "all" || job.department === d) && (l === "all" || levelFor(job.minYears) === l);

function JobBoard() {
  const [dept, setDept] = useState<"all" | Department>("all");
  const [level, setLevel] = useState<"all" | Level>("all");

  const jobs = useMemo(() => JOBS.filter((job) => matches(job, dept, level)), [dept, level]);
  const openings = jobs.reduce((sum, job) => sum + job.positions, 0);

  return (
    <section aria-labelledby="jobs-title" className="cr-board" id="jobs">
      <div className="shell">
        <header className="section-head">
          <p className="eyebrow">Open roles</p>
          <h2 className="section-title" id="jobs-title">
            Current openings
          </h2>
          <p className="section-lede">All roles are full time at our plant in Islamabad. Open a role to read the details.</p>
        </header>

        <div className="cr-filters">
          <div aria-labelledby="f-dept" className="cr-filter" role="group">
            <p className="cr-filter__label" id="f-dept">
              Department
            </p>
            <div className="cr-filter__chips">
              {DEPARTMENTS.map((d) => (
                <GlassChip
                  count={JOBS.filter((job) => matches(job, d.id, level)).length}
                  key={d.id}
                  onClick={() => setDept(d.id)}
                  pressed={dept === d.id}
                >
                  {d.label}
                </GlassChip>
              ))}
            </div>
          </div>
          <div aria-labelledby="f-level" className="cr-filter" role="group">
            <p className="cr-filter__label" id="f-level">
              Experience
            </p>
            <div className="cr-filter__chips">
              {LEVELS.map((l) => (
                <GlassChip
                  count={JOBS.filter((job) => matches(job, dept, l.id)).length}
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  pressed={level === l.id}
                >
                  {l.label}
                  {l.range ? <span className="cr-chip-range"> {l.range}</span> : null}
                </GlassChip>
              ))}
            </div>
          </div>
        </div>

        <p aria-live="polite" className="cr-count">
          {jobs.length} {jobs.length === 1 ? "role" : "roles"}, {openings} {openings === 1 ? "opening" : "openings"}
        </p>

        {jobs.length ? (
          <ul className="cr-jobs">
            {jobs.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </ul>
        ) : (
          <div className="cr-empty">
            <p className="cr-empty__title">No roles match these filters right now.</p>
            <p className="cr-empty__body">Try another filter, or send us your CV and we will keep it on file.</p>
            <button
              className="cr-empty__reset"
              onClick={() => {
                setDept("all");
                setLevel("all");
              }}
              type="button"
            >
              Show all roles
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- CV band */

function CvBand() {
  return (
    <section aria-labelledby="cv-title" className="cr-cv-section">
      <div className="shell">
        <div className="cr-cv">
          <div>
            <p className="eyebrow">General application</p>
            <h2 className="section-title" id="cv-title">
              No matching role?
            </h2>
            <p className="cr-cv__lede">
              Send us your CV and tell us what you do best. We read every one and get in touch when a fit opens up.
            </p>
          </div>
          <div className="cr-cv__end">
            <GlassLink className="gx-pill gx-pill--bead-end" href={cvHref()} tone="primary">
              <span>Send us your CV</span>
              <span aria-hidden="true" className="gx-bead">
                <MailGlyph />
              </span>
            </GlassLink>
            <p className="cr-cv__mail">{APPLY_EMAIL}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CareersPage() {
  return (
    <>
      <Hero />
      <JobBoard />
      <CvBand />
    </>
  );
}
