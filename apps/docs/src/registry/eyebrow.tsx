"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

export type EyebrowProps = {
  /** The label, e.g. "// 02 — projects". */
  text: string;
  /** Element to render. Use "h2"/"p" when the label is part of your heading structure. @default "p" */
  as?: ElementType;
  /** Type the label in when it scrolls into view. false shows it as plain text. @default true */
  typing?: boolean;
  /** Milliseconds per typed character. @default 32 */
  speed?: number;
  /** Clear the label when it leaves the viewport, so it types again next time. @default true */
  replay?: boolean;
  /** Type even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root element. */
  className?: string;
};

/**
 * A small mono label that sits above a section heading and types itself out,
 * with a blinking block cursor, each time it scrolls into view.
 * The full text is rendered on the server and kept in a screen-reader-only copy,
 * so there is no hydration mismatch and assistive tech reads it once, whole.
 */
export function Eyebrow({
  text,
  as: Tag = "p",
  typing = true,
  speed = 32,
  replay = true,
  ignoreReducedMotion = false,
  className,
}: EyebrowProps) {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(text.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || !typing) return;
    if (!ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let id: ReturnType<typeof setInterval> | undefined;
    let typed = false;
    const stop = () => {
      if (id) clearInterval(id);
      id = undefined;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) {
          if (replay) {
            stop();
            typed = false;
            setN(0);
          }
          return;
        }
        if (typed) return;
        typed = true;
        stop();
        let i = 0;
        setN(0);
        id = setInterval(() => {
          i += 1;
          setN(i);
          if (i >= text.length) stop();
        }, speed);
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
      setN(text.length);
    };
  }, [text, typing, speed, replay, ignoreReducedMotion]);

  const shown = Math.min(n, text.length);

  return (
    <Tag ref={ref} className={["font-mpk-mono text-[13px] text-mpk-dim2", className].filter(Boolean).join(" ")}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length && (
          <span className="inline-block h-[1em] w-[0.55em] -mb-[0.15em] animate-mpk-blink bg-mpk-dim2" />
        )}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
    </Tag>
  );
}
