"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type AsciiImageProps = {
  /** Image URL. */
  src: string;
  /** Alt text for the image. */
  alt: string;
  /** "view" decodes when the image scrolls into view; "mount" right after load. @default "view" */
  trigger?: "mount" | "view";
  /** Hold the code wall until this turns true (e.g. after an intro screen ends). @default true */
  play?: boolean;
  /** Characters the code wall is made of. @default "01<>/{}$#=+*" */
  chars?: string;
  /** Size of one glyph cell in px. @default 14 */
  cell?: number;
  /** Milliseconds to wait (wall fully shown) before decoding starts. @default 300 */
  delay?: number;
  /** Milliseconds the left-to-right decode takes. @default 1800 */
  duration?: number;
  /** Skip the effect on weak devices (4 cores or fewer, 4 GB or less, or Save-Data on). @default true */
  skipOnLowPower?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Called once when the decode finishes (or right away when it is skipped). */
  onDone?: () => void;
  /** Classes for the frame: set its size here, e.g. "aspect-[4/5] w-64". */
  className?: string;
};

const noopSubscribe = () => () => {};

/** false during SSR and hydration, true afterwards. */
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function isLowPower() {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (
    (n.hardwareConcurrency > 0 && n.hardwareConcurrency <= 4) ||
    (n.deviceMemory !== undefined && n.deviceMemory <= 4) ||
    n.connection?.saveData === true
  );
}

/**
 * An image that starts as a wall of flickering code glyphs and "decodes" into
 * the real picture in a noisy left-to-right sweep. Colors come from the theme
 * tokens. The <img> is always in the DOM, so the alt text and the picture are
 * there without JavaScript; the canvas on top is decorative.
 */
export function AsciiImage({
  src,
  alt,
  trigger = "view",
  play = true,
  chars = "01<>/{}$#=+*",
  cell = 14,
  delay = 300,
  duration = 1800,
  skipOnLowPower = true,
  ignoreReducedMotion = false,
  onDone,
  className,
}: AsciiImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  const mounted = useMounted();
  const [done, setDone] = useState(false);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  // Decided on the client only, so the server and first client render match (photo visible).
  const skip =
    mounted &&
    ((!ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      (skipOnLowPower && isLowPower()));
  const covered = mounted && !skip && !done;

  useEffect(() => {
    if (!mounted) return;
    if (skip) {
      doneRef.current?.();
      return;
    }
    const frame = frameRef.current;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!frame || !c || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    const css = getComputedStyle(frame);
    const bg = css.getPropertyValue("--mpk-bg").trim() || "black";
    const accent = css.getPropertyValue("--mpk-blue").trim() || "white";
    const ink = css.getPropertyValue("--mpk-ink").trim() || "white";
    const glyphs = chars || "01";
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];

    // Each cell decodes at its own moment: a left-to-right sweep with noise.
    const at = Array.from({ length: cols * rows }, (_, i) => ((i % cols) / cols) * 0.55 + Math.random() * 0.45);
    const glyph = at.map(pick);
    ctx.font = `${cell - 2}px ui-monospace, monospace`;
    ctx.textBaseline = "top";

    let raf = 0;
    let n = 0;
    let start = Infinity;
    const draw = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      ctx.clearRect(0, 0, w, h);
      n += 1;
      for (let i = 0; i < at.length; i++) {
        if (at[i] < p - 0.02) continue; // decoded: the photo shows through
        if (n % 3 === 0 && Math.random() < 0.25) glyph[i] = pick();
        const x = (i % cols) * cell;
        const y = Math.floor(i / cols) * cell;
        const edge = at[i] < p + 0.05; // cells about to decode flash bright
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, cell, cell);
        ctx.globalAlpha = edge ? 1 : 0.55;
        ctx.fillStyle = edge ? ink : accent;
        ctx.fillText(glyph[i], x + 1, y + 1);
      }
      ctx.globalAlpha = 1;
      if (p < 1) raf = requestAnimationFrame(draw);
      else {
        ctx.clearRect(0, 0, w, h);
        setDone(true);
        doneRef.current?.();
      }
    };
    raf = requestAnimationFrame(draw); // wall is drawn right away; decoding waits for `start`

    let io: IntersectionObserver | undefined;
    const go = () => {
      if (start === Infinity) start = performance.now() + delay;
    };
    if (play) {
      if (trigger === "mount") go();
      else {
        io = new IntersectionObserver(([e]) => e.isIntersecting && go(), { threshold: 0.3 });
        io.observe(frame);
      }
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [mounted, skip, play, trigger, chars, cell, delay, duration]);

  return (
    <div ref={frameRef} className={["relative overflow-hidden bg-mpk-bg", className].filter(Boolean).join(" ")}>
      {/* A plain <img> keeps the component framework-agnostic. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 block size-full object-cover" />
      {!skip && !done && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={["absolute inset-0 size-full", covered ? "" : "invisible"].join(" ")}
        />
      )}
    </div>
  );
}
