"use client";

import { useEffect, useState, type ReactNode } from "react";

export type TmuxWindow = {
  /** Window name, e.g. "zsh" or "docs". */
  label: string;
  /** Turns the window into a button. */
  onSelect?: () => void;
  /** Turns the window into a link. */
  href?: string;
};

export type TmuxSegment = {
  /** What the segment shows. */
  label: ReactNode;
  /** Text color. @default "dim" */
  tone?: "dim" | "ink" | "amber" | "blue";
  /** Put a small pulsing "live" square in front (it stays still under reduced motion). @default false */
  live?: boolean;
  /** Hide it on narrow screens (below 640px). @default false */
  collapse?: boolean;
  /** Turns the segment into a button. */
  onClick?: () => void;
  /** Accessible name when the label alone is not clear. */
  ariaLabel?: string;
};

export type TmuxBarProps = {
  /** Session name in the highlighted block on the left. @default "0" */
  session?: string;
  /** Windows listed after the session, as `0:zsh*`. Strings work too. @default ["zsh"] */
  windows?: (string | TmuxWindow)[];
  /** Index of the active window (marked with `*`). @default 0 */
  activeWindow?: number;
  /** Your own segments, shown on the right before the built-ins. @default [] */
  segments?: TmuxSegment[];
  /** Host name in quotes, like tmux's default status-right. */
  host?: string;
  /** Show a clock (HH:MM). @default true */
  clock?: boolean;
  /** IANA time zone for the clock, e.g. "Africa/Tunis". @default the visitor's own */
  timeZone?: string;
  /** Text before the clock, e.g. "Tunis". */
  clockLabel?: string;
  /** Show the time since the page opened, as "up 03:12". @default false */
  uptime?: boolean;
  /** Show how far the page is scrolled, as a percentage. @default false */
  scrollProgress?: boolean;
  /** Pin the bar to the bottom of the viewport. @default false */
  fixed?: boolean;
  /** Extra classes for the bar. */
  className?: string;
};

const TONE: Record<NonNullable<TmuxSegment["tone"]>, string> = {
  dim: "text-mpk-dim",
  ink: "text-mpk-ink",
  amber: "text-mpk-amber",
  blue: "text-mpk-blue",
};

const FOCUS = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-mpk-amber";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function formatTime(d: Date, timeZone?: string): string {
  try {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
  } catch {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

/**
 * A tmux-style status bar: session block and window list on the left, your
 * segments, host, clock, uptime and scroll position on the right.
 * Time-based parts render a placeholder on the server, so there is no
 * hydration mismatch.
 */
export function TmuxBar({
  session = "0",
  windows = ["zsh"],
  activeWindow = 0,
  segments = [],
  host,
  clock = true,
  timeZone,
  clockLabel,
  uptime = false,
  scrollProgress = false,
  fixed = false,
  className,
}: TmuxBarProps) {
  const [time, setTime] = useState("");
  const [secs, setSecs] = useState<number | null>(null);
  const [scroll, setScroll] = useState<number | null>(null);

  useEffect(() => {
    if (!clock && !uptime) return;
    const started = Date.now();
    const tick = () => {
      if (clock) setTime(formatTime(new Date(), timeZone));
      if (uptime) setSecs(Math.floor((Date.now() - started) / 1000));
    };
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, uptime ? 1000 : 10_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [clock, uptime, timeZone]);

  useEffect(() => {
    if (!scrollProgress) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollProgress]);

  const wins = windows.map((w) => (typeof w === "string" ? { label: w } : w));

  return (
    <div
      className={cx(
        "flex w-full items-center gap-4 overflow-hidden border-t border-mpk-line bg-mpk-bg-soft pr-4 font-mpk-mono text-[11px] leading-[22px] whitespace-nowrap text-mpk-dim",
        fixed && "fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom,0px)]",
        className,
      )}
    >
      <span className="bg-mpk-blue px-2 text-mpk-bg">[{session}]</span>

      {wins.length > 0 && (
        <ul aria-label="Windows" className="m-0 flex min-w-0 list-none gap-3 p-0">
          {wins.map((w, i) => {
            const active = i === activeWindow;
            const text = (
              <>
                {i}:{w.label}
                {active && <span aria-hidden="true">*</span>}
              </>
            );
            const cls = cx(active ? "text-mpk-ink" : "text-mpk-dim", (w.onSelect || w.href) && "transition-colors hover:text-mpk-blue", FOCUS);
            return (
              <li key={`${i}-${w.label}`}>
                {w.href ? (
                  <a href={w.href} aria-current={active ? "page" : undefined} className={cls}>
                    {text}
                  </a>
                ) : w.onSelect ? (
                  <button type="button" onClick={w.onSelect} aria-current={active || undefined} className={cx("bg-transparent p-0", cls)}>
                    {text}
                  </button>
                ) : (
                  <span aria-current={active || undefined} className={cls}>
                    {text}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <span className="flex-1" />

      {segments.map((s, i) => {
        const cls = cx("inline-flex items-center gap-1.5", TONE[s.tone ?? "dim"], s.collapse && "max-sm:hidden");
        const content = (
          <>
            {s.live && (
              <span aria-hidden="true" className="inline-block size-1.5 bg-mpk-blue motion-safe:animate-pulse" />
            )}
            {s.label}
          </>
        );
        return s.onClick ? (
          <button
            key={i}
            type="button"
            onClick={s.onClick}
            aria-label={s.ariaLabel}
            className={cx(cls, "bg-transparent p-0 transition-colors hover:text-mpk-ink", FOCUS)}
          >
            {content}
          </button>
        ) : (
          <span key={i} aria-label={s.ariaLabel} className={cls}>
            {content}
          </span>
        );
      })}

      {host && <span className="text-mpk-dim max-sm:hidden">&quot;{host}&quot;</span>}
      {uptime && <span className="text-mpk-dim max-sm:hidden">up {secs === null ? "--:--" : formatUptime(secs)}</span>}
      {clock && (
        <span className="text-mpk-ink">
          {clockLabel && <span className="text-mpk-dim">{clockLabel} </span>}
          <time>{time || "--:--"}</time>
        </span>
      )}
      {scrollProgress && <span className="text-mpk-amber">{scroll === null ? "--" : scroll}%</span>}
    </div>
  );
}
