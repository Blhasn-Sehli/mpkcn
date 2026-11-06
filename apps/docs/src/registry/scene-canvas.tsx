"use client";

import { useEffect, useRef } from "react";

export type SceneCanvasProps = {
  /** Cover the whole viewport behind the page (fixed, below the content) instead of filling the nearest positioned parent. @default false */
  fullscreen?: boolean;
  /** Accent the dots are drawn in. @default "blue" */
  color?: "blue" | "amber" | "dim";
  /** Distance between dots in px. Larger is lighter on the CPU. @default 44 */
  spacing?: number;
  /** Base dot opacity from 0 to 1 (the wave moves it ±0.05). @default 0.1 */
  opacity?: number;
  /** Shift the grid slightly with the pointer. @default true */
  parallax?: boolean;
  /** Frame-rate cap. The wave is slow, so 30 looks smooth at half the cost. @default 30 */
  fps?: number;
  /** Animate even when the user prefers reduced motion (otherwise a still frame is drawn). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the canvas. */
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

const TEXT_COLOR = { blue: "text-mpk-blue", amber: "text-mpk-amber", dim: "text-mpk-dim" } as const;
const LEVELS = 6;

/**
 * A slow wave rippling through a grid of dots, drawn on a canvas. Built to stay
 * light: capped frame rate, one path per opacity level, and it stops drawing
 * while off screen or in a hidden tab. Under reduced motion, on low-power
 * devices, or if its first frames run well below the `fps` cap, it settles on one still frame.
 */
export function SceneCanvas({
  fullscreen = false,
  color = "blue",
  spacing = 44,
  opacity = 0.1,
  parallax = true,
  fps = 30,
  ignoreReducedMotion = false,
  className = "",
}: SceneCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = !ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let still = reduced || isLowPower();
    const gap = Math.max(12, spacing);
    const frameMs = 1000 / Math.max(1, fps);
    let W = 0;
    let H = 0;
    let mx = 0;
    let my = 0;
    let t = 0;
    let raf = 0;
    let last = 0;
    let onScreen = true;
    let ink = "";
    // fps probe: average frame time over the first ~60 animated frames
    let probeN = 0;
    let probeSum = 0;

    // The canvas carries text-mpk-*, so its computed color is the resolved token
    // in the current theme (rgb or oklch, both valid fillStyles).
    const readInk = () => {
      ink = getComputedStyle(canvas).color;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / gap) + 2;
      const rows = Math.ceil(H / gap) + 2;
      const ox = mx * 18;
      const oy = my * 12;
      const lo = Math.max(0.02, opacity - 0.05);
      const step = (opacity + 0.05 - lo) / (LEVELS - 1);
      ctx.fillStyle = ink;
      // one path per opacity level instead of one fill per dot
      for (let lv = 0; lv < LEVELS; lv++) {
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const wave = Math.sin(t * 0.6 + i * 0.35 + j * 0.28);
            const level = Math.min(LEVELS - 1, Math.max(0, Math.round((wave * 0.05 + opacity - lo) / step)));
            if (level !== lv) continue;
            const px = i * gap - gap + ox * (j / rows);
            const py = j * gap - gap + oy + wave * 1.4;
            const radius = 1.1 + Math.max(0, wave) * 0.7;
            ctx.moveTo(px + radius, py);
            ctx.arc(px, py, radius, 0, Math.PI * 2);
          }
        }
        ctx.globalAlpha = Math.min(1, lo + step * lv);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const running = () => !still && onScreen && !document.hidden;

    const tick = (now: number) => {
      raf = 0;
      if (!running()) return;
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      if (last && dt < frameMs - 2) return;
      if (last && probeN < 60) {
        probeN++;
        probeSum += dt;
        if (probeN === 60 && probeSum / 60 > frameMs * 1.5) still = true; // struggling device: settle
      }
      last = now;
      t += 0.02 * Math.min(4, (dt || frameMs) / 32);
      draw();
    };

    const start = () => {
      if (!raf && running()) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    readInk();
    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      start();
    });
    io.observe(canvas);

    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);

    // Redraw in the new color when the theme class flips.
    const mo = new MutationObserver(() => {
      readInk();
      draw();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      my = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
    };
    if (parallax && !still) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
    };
  }, [color, spacing, opacity, parallax, fps, ignoreReducedMotion]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none inset-0 block ${
        fullscreen ? "fixed -z-10 h-dvh w-screen" : "absolute h-full w-full"
      } ${TEXT_COLOR[color]} ${className}`}
    />
  );
}
