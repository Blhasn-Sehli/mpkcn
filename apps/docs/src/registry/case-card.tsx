"use client";

import { useState, type ReactNode } from "react";

export type CaseCardLink = {
  /** Button text, e.g. "code" or "live demo". */
  label: string;
  href: string;
  /** Accessible name when the label alone is not clear, e.g. "Atlas source code". */
  ariaLabel?: string;
};

export type CaseCardProps = {
  /** Project name, shown large. */
  title: ReactNode;
  /** Small number or tag above the title, e.g. "01". */
  index?: string;
  /** Mono line under the title, e.g. "Map viewer · 2026". */
  subtitle?: ReactNode;
  /** A sentence or two about the project. */
  description?: ReactNode;
  /** What you did on it, shown as a second paragraph. */
  role?: ReactNode;
  /** Tech or topic tags. @default [] */
  tags?: string[];
  /** Buttons under the tags. External http(s) links open in a new tab. @default [] */
  links?: CaseCardLink[];
  /** Screenshot under the text. A missing or broken src shows a striped placeholder. */
  image?: { src?: string; alt: string };
  /** Your own media in place of `image` (a video, a carousel…). */
  media?: ReactNode;
  /** Label / value rows in the second column, e.g. { label: "Runtime", value: "Node 22" }. */
  features?: { label: ReactNode; value: ReactNode }[];
  /** Heading level of the title. @default 3 */
  headingLevel?: 2 | 3 | 4;
  /** Extra classes for the card. */
  className?: string;
};

const FOCUS = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function Shot({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const show = Boolean(src) && failedSrc !== src;
  // Catches a load error that happened before hydration (onError would not fire for it).
  const check = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0 && src) setFailedSrc(src);
  };
  return (
    <div
      role={show ? undefined : "img"}
      aria-label={show ? undefined : alt}
      className="relative flex aspect-video items-end overflow-hidden border border-mpk-line bg-mpk-bg-soft bg-[repeating-linear-gradient(135deg,transparent_0_10px,var(--mpk-line)_10px_11px)]"
    >
      {show ? (
        // A plain <img> keeps the component framework-agnostic; swap in next/image if you like.
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={check} src={src} alt={alt} onError={() => setFailedSrc(src ?? null)} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span aria-hidden="true" className="m-3 border border-mpk-line bg-mpk-bg px-2 py-1 font-mpk-mono text-[11px] text-mpk-dim">
          screenshot coming soon
        </span>
      )}
    </div>
  );
}

/**
 * A project case study laid out as two columns: name, one-liner, role, tags,
 * links and a screenshot on the left, a spec-sheet list of features on the
 * right. It stacks into one column when the card is narrower than 768px
 * (a container query), or when there are no features.
 */
export function CaseCard({
  title,
  index,
  subtitle,
  description,
  role,
  tags = [],
  links = [],
  image,
  media,
  features,
  headingLevel = 3,
  className,
}: CaseCardProps) {
  const Heading = `h${headingLevel}` as const;
  const rows = features ?? [];
  const twoCol = rows.length > 0;

  return (
    <article className={cx("@container border-y border-mpk-line py-10 @3xl:py-14", className)}>
      <div className={cx("grid gap-7", twoCol && "@3xl:grid-cols-[0.9fr_1.1fr] @3xl:gap-12")}>
        <div className="min-w-0">
          {index && <p className="m-0 mb-2 font-mpk-mono text-[12px] text-mpk-amber">{index}</p>}
          <Heading className="m-0 font-mpk-sans text-[clamp(1.6rem,4cqi,2.6rem)] leading-tight font-semibold tracking-tight text-mpk-ink">
            {title}
          </Heading>
          {subtitle && <p className="mt-1.5 mb-0 font-mpk-mono text-[0.95rem] text-mpk-dim">{subtitle}</p>}
          {description && <p className="mt-6 mb-0 max-w-[44ch] text-[0.98rem] leading-relaxed text-mpk-dim">{description}</p>}
          {role && <p className="mt-4 mb-0 max-w-[44ch] text-[0.98rem] leading-relaxed text-mpk-dim">{role}</p>}

          {tags.length > 0 && (
            <ul aria-label="Tags" className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
              {tags.map((t) => (
                <li key={t} className="border border-mpk-line px-2.5 py-1 font-mpk-mono text-[12px] text-mpk-dim2">
                  {t}
                </li>
              ))}
            </ul>
          )}

          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {links.map((l) => {
                const external = isExternal(l.href);
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    aria-label={l.ariaLabel ? `${l.ariaLabel}${external ? " (opens in a new tab)" : ""}` : undefined}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cx(
                      "group inline-flex items-center gap-2 border border-mpk-line px-3 py-1.5 font-mpk-mono text-[12px] text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue",
                      FOCUS,
                    )}
                  >
                    {l.label}
                    <span aria-hidden="true" className="text-mpk-dim2 transition-colors group-hover:text-mpk-blue">
                      {external ? "↗" : "→"}
                    </span>
                    {external && !l.ariaLabel && <span className="sr-only"> (opens in a new tab)</span>}
                  </a>
                );
              })}
            </div>
          )}

          {(media || image) && <div className="mt-7">{media ?? (image && <Shot src={image.src} alt={image.alt} />)}</div>}
        </div>

        {twoCol && (
          <dl className="m-0 self-start font-mpk-mono text-[0.92rem] text-mpk-dim">
            {rows.map((f, i) => (
              <div key={i} className="flex justify-between gap-4 border-t border-mpk-line py-2.5 last:border-b">
                <dt className="text-mpk-ink">{f.label}</dt>
                <dd className="m-0 text-right">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
