"use client";

import { useEffect, useRef } from "react";

export type CursorProps = {
  /** Fill the nearest positioned parent and follow the pointer only inside it, instead of the whole window (for previews and cards). @default false */
  contained?: boolean;
  /** Pull elements marked `data-magnetic` toward the pointer and grow the ring over them. @default true */
  magnetic?: boolean;
  /** Hide the system cursor while the custom one is active. Text fields always keep the system cursor. @default false */
  hideNativeCursor?: boolean;
  /** How fast the ring catches up with the pointer, from 0 (never) to 1 (instantly). @default 0.16 */
  lag?: number;
  /** Run even when the user prefers reduced motion (e.g. behind an explicit "play" button). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the wrapper (e.g. a different z-index). */
  className?: string;
};

type NavigatorWithHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Few cores, little memory, data saver, or `<html data-perf="low">`. */
function isLowPower(): boolean {
  try {
    if (document.documentElement.dataset.perf === "low") return true;
    const n = navigator as NavigatorWithHints;
    return Boolean(
      (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 4) || n.connection?.saveData,
    );
  } catch {
    return false;
  }
}

const TEXT_FIELD =
  'input:not([type=button],[type=submit],[type=reset],[type=checkbox],[type=radio],[type=range],[type=color],[type=file]),textarea,select,[contenteditable]:not([contenteditable="false"])';
const HIDE_ATTR = "data-mpk-cursor-hide";

/**
 * A terminal-style cursor: a small amber block that tracks the pointer and a
 * square ring that trails behind it. It turns itself off on touch and coarse
 * pointers, under reduced motion and on low-power devices, steps aside over
 * text fields and while the keyboard is in use, and never blocks clicks.
 */
export function Cursor({
  contained = false,
  magnetic = true,
  hideNativeCursor = false,
  lag = 0.16,
  ignoreReducedMotion = false,
  className = "",
}: CursorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const scope = contained ? root?.parentElement : document.documentElement;
    if (!root || !dot || !ring || !scope) return;

    const query = ignoreReducedMotion
      ? "(hover: none), (pointer: coarse)"
      : "(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)";
    if (window.matchMedia(query).matches || isLowPower()) return;

    const k = Math.min(1, Math.max(0, lag));
    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;
    let shown = false;
    let magnet: HTMLElement | null = null;

    const setShown = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      root.style.opacity = on ? "1" : "0";
      if (hideNativeCursor) scope.toggleAttribute(HIDE_ATTR, on);
    };

    const releaseMagnet = () => {
      if (!magnet) return;
      magnet.style.transform = "";
      magnet = null;
      ring.dataset.magnetic = "false";
    };

    const place = (el: HTMLElement, px: number, py: number) => {
      el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    };

    const loop = () => {
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      place(ring, rx, ry);
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target instanceof Element ? e.target : null;
      // Text fields keep the system I-beam and caret: step aside.
      if (target?.closest(TEXT_FIELD)) {
        setShown(false);
        releaseMagnet();
        return;
      }
      const r = root.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!shown) {
        rx = x;
        ry = y;
      }
      setShown(true);
      place(dot, x, y);
      if (!raf) raf = requestAnimationFrame(loop);

      if (!magnetic) return;
      const m = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (m !== magnet) releaseMagnet();
      if (m && scope.contains(m)) {
        magnet = m;
        ring.dataset.magnetic = "true";
        const b = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px, ${(e.clientY - b.top - b.height / 2) * 0.35}px)`;
      }
    };

    const onLeave = () => {
      setShown(false);
      releaseMagnet();
    };
    // Keyboard in use: give the stage back to the focus ring and system cursor.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || (e.target instanceof Element && e.target.closest(TEXT_FIELD))) onLeave();
    };

    scope.addEventListener("pointermove", onMove, { passive: true });
    scope.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onLeave);

    return () => {
      scope.removeEventListener("pointermove", onMove);
      scope.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onLeave);
      cancelAnimationFrame(raf);
      releaseMagnet();
      scope.removeAttribute(HIDE_ATTR);
      root.style.opacity = "0";
    };
  }, [contained, magnetic, hideNativeCursor, lag, ignoreReducedMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className={`pointer-events-none inset-0 z-[90] overflow-hidden transition-opacity duration-150 ${
        contained ? "absolute" : "fixed"
      } ${className}`}
    >
      {hideNativeCursor && (
        <style>{`[${HIDE_ATTR}],[${HIDE_ATTR}] *{cursor:none!important}[${HIDE_ATTR}] :is(${TEXT_FIELD}){cursor:auto!important}`}</style>
      )}
      <div
        ref={ringRef}
        data-magnetic="false"
        className="absolute top-0 left-0 size-8 border border-mpk-dim2 transition-[width,height,border-color] duration-200 will-change-transform data-[magnetic=true]:size-16 data-[magnetic=true]:border-mpk-blue"
      />
      <div ref={dotRef} className="absolute top-0 left-0 h-3 w-1.5 bg-mpk-amber will-change-transform" />
    </div>
  );
}
