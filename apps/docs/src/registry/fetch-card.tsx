"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import { useRef, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";

export type FetchRow = {
  /** Key on the left, in amber, e.g. "os". */
  label: string;
  /** Value on the right. */
  value: ReactNode;
};

export type FetchCardProps = {
  /** ASCII art on the left. A string is split into lines; any other node is shown as is. */
  art?: ReactNode;
  /** Accessible name for the art (e.g. the word it spells). Without it the art is hidden from screen readers. */
  artLabel?: string;
  /** Header user, shown as user@host. @default "guest" */
  user?: string;
  /** Header host, shown as user@host. @default "localhost" */
  host?: string;
  /** Replaces the user@host header. */
  title?: ReactNode;
  /** Key / value rows under the header. */
  rows: FetchRow[];
  /** Show the row of color swatches at the bottom, like neofetch. @default true */
  palette?: boolean;
  /** Accent of the art and header. @default "blue" */
  tone?: "blue" | "amber";
  /** Slide the art lines and rows in when the card scrolls into view. @default true */
  animate?: boolean;
  /** Tilt the art in 3D towards a mouse pointer. @default true */
  tilt?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root. */
  className?: string;
  /** Classes for the art (font size, line height). @default "text-[11px]" */
  artClassName?: string;
};

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReduced() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

const EASE = [0.22, 1, 0.36, 1] as const;
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const line: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

const SWATCHES = ["bg-mpk-bg", "bg-mpk-line", "bg-mpk-dim2", "bg-mpk-dim", "bg-mpk-ink", "bg-mpk-amber", "bg-mpk-blue"];

/**
 * A neofetch-style info card: ASCII art on the left, a user@host header, then
 * key / value rows and a palette strip. Lines slide in when the card scrolls
 * into view and the art tilts towards the mouse; under reduced motion it is
 * still. Wraps to one column when narrow.
 */
export function FetchCard({
  art,
  artLabel,
  user = "guest",
  host = "localhost",
  title,
  rows,
  palette = true,
  tone = "blue",
  animate = true,
  tilt = true,
  ignoreReducedMotion = false,
  className,
  artClassName,
}: FetchCardProps) {
  const reduced = useReduced() && !ignoreReducedMotion;
  const artRef = useRef<HTMLElement | null>(null);
  const setArt = (el: HTMLElement | null) => {
    artRef.current = el;
  };
  const accent = tone === "blue" ? "text-mpk-blue" : "text-mpk-amber";

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = artRef.current;
    if (!tilt || reduced || !el || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 20).toFixed(2)}deg) rotateY(${(px * 26).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    if (artRef.current) artRef.current.style.transform = "";
  };

  const show = animate ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 } } : {};
  const variants = animate ? line : undefined;
  const artA11y = artLabel ? { role: "img" as const, "aria-label": artLabel } : { "aria-hidden": true as const };

  return (
    <MotionConfig reducedMotion={ignoreReducedMotion ? "never" : "user"}>
      <div
        className={cx(
          "flex w-full flex-wrap items-center gap-x-8 gap-y-5 font-mpk-mono text-[13px] leading-relaxed text-mpk-ink",
          className,
        )}
      >
        {art !== undefined && art !== null && (
          <div className="[perspective:700px]" onPointerMove={onMove} onPointerLeave={onLeave}>
            {typeof art === "string" ? (
              <motion.pre
                ref={setArt}
                {...artA11y}
                variants={animate ? list : undefined}
                {...show}
                className={cx(
                  "m-0 leading-[1.05] whitespace-pre transition-transform duration-150 ease-out [transform-style:preserve-3d]",
                  accent,
                  artClassName ?? "text-[11px]",
                )}
              >
                {art.replace(/^\n+|\n+$/g, "").split("\n").map((l, i) => (
                  <motion.span key={i} variants={variants} className="block">
                    {l || " "}
                  </motion.span>
                ))}
              </motion.pre>
            ) : (
              <div
                ref={setArt}
                {...artA11y}
                className={cx("transition-transform duration-150 ease-out [transform-style:preserve-3d]", accent, artClassName)}
              >
                {art}
              </div>
            )}
          </div>
        )}

        <motion.div className="min-w-0 flex-1 basis-56" variants={animate ? list : undefined} {...show}>
          <motion.div variants={variants} className="font-bold break-words">
            {title ?? (
              <>
                <span className={accent}>{user}</span>
                <span className="text-mpk-dim">@</span>
                <span className={accent}>{host}</span>
              </>
            )}
          </motion.div>
          <motion.div variants={variants} aria-hidden="true" className="my-1.5 h-px bg-mpk-line" />
          <dl className="m-0">
            {rows.map((r, i) => (
              <motion.div key={`${r.label}-${i}`} variants={variants} className="flex gap-3">
                <dt className="w-[8ch] shrink-0 truncate text-mpk-amber">{r.label}</dt>
                <dd className="m-0 min-w-0 break-words">{r.value}</dd>
              </motion.div>
            ))}
          </dl>
          {palette && (
            <motion.div variants={variants} aria-hidden="true" className="mt-3 flex">
              {SWATCHES.map((s) => (
                <span key={s} className={cx("h-3.5 w-6 border border-mpk-line", s)} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </MotionConfig>
  );
}
