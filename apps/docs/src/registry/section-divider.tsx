"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

export type SectionDividerProps = {
  /** Section you are leaving. Shown dimmed as "EOF {from}". Leave empty to show only the command. */
  from?: string;
  /** Section you are going to. Shown as "$ cd ../{to}" (or "$ cd {to}" when it starts with "~" or "/"). */
  to: string;
  /** Where the label links to. null renders plain text instead of a link. @default `#${to}` */
  href?: string | null;
  /** Called when the label is clicked (after the default smooth scroll to an in-page anchor). */
  onNavigate?: () => void;
  /** Type the label in once the lines have grown. false shows it at once. @default true */
  typing?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root element (spacing is up to you). */
  className?: string;
};

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * A terminal-style divider between page sections: two hairlines grow out from
 * the middle, then a bordered label types "EOF about $ cd ../work". The label
 * is a link to the next section. Resets when it leaves the viewport.
 */
export function SectionDivider({
  from,
  to,
  href,
  onNavigate,
  typing = true,
  ignoreReducedMotion = false,
  className,
}: SectionDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dim = from ? `EOF ${from} ` : "";
  const cmd = `$ cd ${to.startsWith("~") || to.startsWith("/") ? to : `../${to}`}`;
  const total = dim.length + cmd.length;
  const [seen, setSeen] = useState(false);
  const [n, setN] = useState(total);
  const target = href === undefined ? `#${to}` : href;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = !ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let delay: ReturnType<typeof setTimeout> | undefined;
    let tick: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearTimeout(delay);
      clearInterval(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        stop();
        setSeen(e.isIntersecting);
        if (still || !typing) {
          setN(total);
          return;
        }
        if (!e.isIntersecting) {
          setN(0);
          return;
        }
        let i = 0;
        setN(0);
        // Start typing once the lines have mostly grown.
        delay = setTimeout(() => {
          tick = setInterval(() => {
            i += 1;
            setN(i);
            if (i >= total) clearInterval(tick);
          }, 28);
        }, 350);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [total, typing, ignoreReducedMotion]);

  const shown = Math.min(n, total);
  const label = `${dim}${cmd}`;
  const anim = ignoreReducedMotion ? "" : "motion-reduce:transition-none";

  const body = (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        <span className="text-mpk-dim2">{dim.slice(0, shown)}</span>
        {shown > dim.length && cmd.slice(0, shown - dim.length)}
        {seen && shown < total && (
          <span className="inline-block h-[1em] w-[0.55em] -mb-[0.15em] animate-mpk-blink bg-mpk-dim2" />
        )}
        <span className="invisible">{label.slice(shown)}</span>
      </span>
    </>
  );

  const on = seen;

  const labelCls = cx(
    "relative whitespace-nowrap border px-3.5 py-1.5 transition-[color,border-color,opacity,transform]",
    "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    on ? "scale-100 opacity-100 delay-300" : "scale-[0.85] opacity-0",
    "border-mpk-line",
    anim,
  );
  const line = cx(
    "h-px flex-1 transition-transform duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]",
    on ? "scale-x-100" : "scale-x-0",
    anim,
  );

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (target?.startsWith("#") && target.length > 1) {
      const el = document.getElementById(decodeURIComponent(target.slice(1)));
      if (el) {
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
    onNavigate?.();
  };

  return (
    <div ref={ref} className={cx("flex items-center gap-4 font-mpk-mono text-xs text-mpk-dim", className)}>
      <span aria-hidden="true" className={cx(line, "origin-right bg-linear-to-r from-transparent to-mpk-line to-40%")} />
      {target ? (
        <a
          href={target}
          onClick={onClick}
          className={cx(
            labelCls,
            "outline-none hover:border-mpk-blue hover:text-mpk-blue focus-visible:border-mpk-blue focus-visible:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber",
          )}
        >
          {body}
        </a>
      ) : (
        <span className={labelCls}>{body}</span>
      )}
      <span aria-hidden="true" className={cx(line, "origin-left bg-linear-to-l from-transparent to-mpk-line to-40%")} />
    </div>
  );
}
