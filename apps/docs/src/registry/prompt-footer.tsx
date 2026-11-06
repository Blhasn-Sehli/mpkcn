"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

export type PromptFooterLink = {
  /** Text of the link, e.g. "github". */
  label: string;
  /** Where it goes. External http(s) links open in a new tab. */
  href: string;
};

export type PromptFooterGroup = {
  /** Folder name shown above the links, e.g. "sections" (printed as ~/sections/). */
  title: string;
  links: PromptFooterLink[];
};

export type PromptFooterProps = {
  /** User in the prompt. @default "guest" */
  user?: string;
  /** Host in the prompt. @default "localhost" */
  host?: string;
  /** Working directory in the prompt. @default "~" */
  path?: string;
  /** Link columns, printed as the output of `ls`. @default [] */
  groups?: PromptFooterGroup[];
  /** Key / value lines printed as the output of `cat now.txt`, e.g. { label: "building", value: "a CLI" }. */
  now?: { label: string; value: ReactNode }[];
  /** Name after the © sign. Leave it out to hide the copyright. */
  owner?: string;
  /** Year in the copyright. @default the current year */
  year?: number;
  /** Extra text after the copyright, e.g. "built with Next.js". */
  note?: ReactNode;
  /** Show a live HH:MM:SS clock on the date line. @default false */
  clock?: boolean;
  /** IANA time zone for the clock, e.g. "Europe/Paris". @default the visitor's own */
  timeZone?: string;
  /** Text before the clock, e.g. "Paris". */
  clockLabel?: string;
  /** A "cd ~ ↑" button that scrolls the window back to the top. @default true */
  backToTop?: boolean;
  /** Content after the last prompt, in place of the blinking cursor (an input, a status…). */
  children?: ReactNode;
  /** Your link component, e.g. next/link's `Link`, used for internal links. @default "a" */
  linkComponent?: ComponentType<{ href: string; className?: string; children?: ReactNode }>;
  /** Extra classes for the footer. */
  className?: string;
};

const FOCUS = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function formatClock(d: Date, timeZone?: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  try {
    return d.toLocaleTimeString("en-GB", { ...opts, timeZone });
  } catch {
    return d.toLocaleTimeString("en-GB", opts);
  }
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function Prompt({ user, host, path, cmd }: { user: string; host: string; path: string; cmd?: string }) {
  return (
    <div className="flex flex-wrap gap-x-2" aria-hidden={cmd ? undefined : true}>
      <span>
        <span className="text-mpk-blue">
          {user}@{host}
        </span>
        <span className="text-mpk-dim2">:</span>
        <span className="text-mpk-amber">{path}</span>
        <span className="text-mpk-dim2">$</span>
      </span>
      {cmd && <span className="text-mpk-ink">{cmd}</span>}
    </div>
  );
}

/**
 * A site footer laid out as a shell session: `ls` prints your link columns,
 * `cat now.txt` a short status, `date` the copyright and an optional live clock,
 * and the last prompt waits with a blinking cursor (or your own content).
 * The prompts are decoration; links sit in a labelled <nav> as plain lists.
 */
export function PromptFooter({
  user = "guest",
  host = "localhost",
  path = "~",
  groups = [],
  now,
  owner,
  year,
  note,
  clock = false,
  timeZone,
  clockLabel,
  backToTop = true,
  children,
  linkComponent: Link,
  className,
}: PromptFooterProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!clock) return;
    const tick = () => setTime(formatClock(new Date(), timeZone));
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [clock, timeZone]);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const linkCls = cx("group text-mpk-dim transition-colors hover:text-mpk-blue", FOCUS);
  const prompt = { user, host, path };
  const showDate = Boolean(owner || note || clock);

  return (
    <footer
      className={cx(
        "w-full border-t border-mpk-line bg-mpk-bg px-4 py-8 font-mpk-mono text-[12.5px] leading-relaxed text-mpk-dim sm:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        {groups.length > 0 && (
          <div className="flex flex-col gap-2">
            <Prompt {...prompt} cmd={`ls ${groups.map((g) => `~/${g.title}`).join(" ")}`} />
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
              {groups.map((g) => (
                <div key={g.title} className="flex flex-col gap-1">
                  <span className="text-mpk-dim2">~/{g.title}/</span>
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {g.links.map((l) => {
                      const content = (
                        <>
                          <span aria-hidden="true" className="text-mpk-dim2 transition-colors group-hover:text-mpk-blue">
                            ›{" "}
                          </span>
                          {l.label}
                        </>
                      );
                      return (
                        <li key={l.label}>
                          {isExternal(l.href) ? (
                            <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                              {content}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          ) : Link ? (
                            <Link href={l.href} className={linkCls}>
                              {content}
                            </Link>
                          ) : (
                            <a href={l.href} className={linkCls}>
                              {content}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        )}

        {now && now.length > 0 && (
          <div className="flex flex-col gap-1">
            <Prompt {...prompt} cmd="cat now.txt" />
            <dl className="m-0 flex flex-col gap-0.5">
              {now.map((n) => (
                <div key={n.label} className="flex flex-wrap gap-x-2">
                  <dt className="text-mpk-dim2">{n.label}:</dt>
                  <dd className="m-0 text-mpk-ink">{n.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {showDate && (
          <div className="flex flex-col gap-1">
            <Prompt {...prompt} cmd="date" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span>
                {owner && (
                  <span suppressHydrationWarning>
                    © {year ?? new Date().getFullYear()} {owner}
                  </span>
                )}
                {owner && note && <span className="text-mpk-dim2"> · </span>}
                {note}
              </span>
              {clock && (
                <span className="text-mpk-ink">
                  {clockLabel && <span className="text-mpk-dim">{clockLabel} </span>}
                  <time>{time || "--:--:--"}</time>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Prompt {...prompt} />
            {children ?? (
              <span aria-hidden="true" className="inline-block h-[1.1em] w-[0.55em] bg-mpk-ink animate-mpk-blink motion-reduce:animate-none" />
            )}
          </div>
          {backToTop && (
            <button
              type="button"
              onClick={toTop}
              aria-label="Back to top"
              className={cx("bg-transparent text-mpk-dim transition-colors hover:text-mpk-blue", FOCUS)}
            >
              <span className="text-mpk-amber">$</span> cd ~ ↑
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
