"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startMatrixRain } from "./lib/matrix-rain";

/** ↑ ↑ ↓ ↓ ← → ← → B A */
export const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export type UseKonamiOptions = {
  /** Keys to match, as `KeyboardEvent.key` values (letters in lower case). @default KONAMI_CODE */
  sequence?: string[];
  /** Listen at all. @default true */
  enabled?: boolean;
  /** Ignore keys typed into inputs, textareas and editable content. @default true */
  ignoreInputs?: boolean;
};

const MODIFIERS = ["Shift", "Control", "Alt", "Meta", "CapsLock"];

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
}

/**
 * Calls `onMatch` each time the key sequence (the Konami code by default) is
 * typed anywhere on the page. Returns how many keys of it are currently matched,
 * for showing progress.
 */
export function useKonami(onMatch: () => void, { sequence = KONAMI_CODE, enabled = true, ignoreInputs = true }: UseKonamiOptions = {}): number {
  const [progress, setProgress] = useState(0);
  const onMatchRef = useRef(onMatch);
  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);
  const key = sequence.join("\u0000");

  useEffect(() => {
    if (!enabled) return;
    const seq = key.split("\u0000");
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || MODIFIERS.includes(e.key) || (ignoreInputs && isTyping(e.target))) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
      if (i === seq.length) {
        i = 0;
        setProgress(0);
        onMatchRef.current();
      } else setProgress(i);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setProgress(0);
    };
  }, [enabled, ignoreInputs, key]);

  return progress;
}

export type KonamiProps = {
  /** Called each time the code is entered. */
  onActivate?: () => void;
  /** Keys to match, as `KeyboardEvent.key` values (letters in lower case). @default KONAMI_CODE */
  sequence?: string[];
  /** Listen at all. @default true */
  enabled?: boolean;
  /** Play matrix rain when the code is entered (skipped under reduced motion). @default true */
  rain?: boolean;
  /** How long the rain lasts, in milliseconds. A click or any key ends it early. @default 6000 */
  duration?: number;
  /** Rain over the whole viewport. Set to false to fill the nearest positioned parent instead (for previews). @default true */
  fullscreen?: boolean;
  /** Play the rain even when the user prefers reduced motion (e.g. behind an explicit "play" button). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Called with the number of keys matched so far, for showing progress. */
  onProgress?: (matched: number) => void;
};

/**
 * An easter egg: listens for the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), calls
 * `onActivate`, and plays a few seconds of matrix rain. The rain is decorative,
 * hidden from assistive technology, and skipped under prefers-reduced-motion.
 */
export function Konami({
  onActivate,
  sequence,
  enabled = true,
  rain = true,
  duration = 6000,
  fullscreen = true,
  ignoreReducedMotion = false,
  onProgress,
}: KonamiProps) {
  const [raining, setRaining] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activate = useCallback(() => {
    onActivate?.();
    const reduced = !ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rain && !reduced) setRaining(true);
  }, [onActivate, rain, ignoreReducedMotion]);

  const progress = useKonami(activate, { sequence, enabled });

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onProgressRef.current?.(progress);
  }, [progress]);

  useEffect(() => {
    if (!raining || !canvasRef.current) return;
    const stopRain = startMatrixRain(canvasRef.current);
    const stop = () => setRaining(false);
    const timer = window.setTimeout(stop, duration);
    // Any key ends it early (registered next tick so the final key of the code doesn't).
    const listen = window.setTimeout(() => window.addEventListener("keydown", stop), 0);
    return () => {
      stopRain();
      window.clearTimeout(timer);
      window.clearTimeout(listen);
      window.removeEventListener("keydown", stop);
    };
  }, [raining, duration]);

  if (!raining) return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => setRaining(false)}
      className={`${fullscreen ? "fixed z-[100]" : "absolute z-10"} inset-0 cursor-pointer bg-mpk-bg/60`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
