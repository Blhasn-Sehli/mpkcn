"use client";

import { useEffect, useRef, type RefObject } from "react";

export type ScrollProgressProps = {
  /** Scroll container to track. Leave empty to track the page. @default undefined (the window) */
  target?: RefObject<HTMLElement | null>;
  /** Pin the bar to the viewport. false places it in the nearest positioned parent instead (use with `target`). @default true */
  fixed?: boolean;
  /** Edge the bar sits on. @default "top" */
  position?: "top" | "bottom";
  /** Accent the bar is drawn in. @default "blue" */
  color?: "blue" | "amber";
  /** Bar thickness in px. @default 2 */
  thickness?: number;
  /** Extra classes for the bar. */
  className?: string;
};

const BG = { blue: "bg-mpk-blue", amber: "bg-mpk-amber" } as const;

/**
 * A thin bar that fills from left to right as the page (or a scroll container)
 * is scrolled. It follows the scroll position directly, with no easing, so it
 * reads the same under reduced motion. Decorative: hidden from assistive technology.
 */
export function ScrollProgress({
  target,
  fixed = true,
  position = "top",
  color = "blue",
  thickness = 2,
  className = "",
}: ScrollProgressProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = target?.current ?? null;
    const source: HTMLElement | Window = el ?? window;
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      const top = el ? el.scrollTop : window.scrollY;
      const p = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    source.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Content that grows or shrinks changes the scroll range.
    const ro = new ResizeObserver(schedule);
    ro.observe(el ?? document.documentElement);
    if (el?.firstElementChild) ro.observe(el.firstElementChild);

    return () => {
      source.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ height: thickness, transform: "scaleX(0)" }}
      className={`pointer-events-none inset-x-0 z-[60] origin-left ${fixed ? "fixed" : "absolute"} ${
        position === "top" ? "top-0" : "bottom-0"
      } ${BG[color]} ${className}`}
    />
  );
}
