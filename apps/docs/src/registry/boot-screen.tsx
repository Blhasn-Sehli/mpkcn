"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower, startMatrixRain } from "./lib/matrix-rain";

export type BootScreenHint = {
  /** Text inside the key badge, e.g. "ESC". */
  key: string;
  /** What the key does, shown next to the badge. */
  label: string;
};

export type BootScreenProps = {
  /** Username typed into the login box. @default "guest" */
  user?: string;
  /** Host shown in the box title, which reads "Log in to {host}". @default "mpkcn.dev" */
  host?: string;
  /** Key-hint badges docked to the bottom. @default ESC Reset · ENTER Start session · ANY KEY Skip */
  hints?: BootScreenHint[];
  /** Play a short matrix rain after login (skipped on low-power devices). @default true */
  matrix?: boolean;
  /** Play only once per browser session (sessionStorage key "mpkcn-booted"). @default true */
  oncePerSession?: boolean;
  /** Fixed overlay over the whole page. Set to false to fill the nearest positioned parent instead (for previews). @default true */
  fullscreen?: boolean;
  /** Play even when the user prefers reduced motion (e.g. behind an explicit "play" button). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Called once when the screen finishes, is skipped, or is not shown at all. */
  onDone?: () => void;
  /** Extra classes for the root element. */
  className?: string;
};

const DEFAULT_HINTS: BootScreenHint[] = [
  { key: "ESC", label: "Reset" },
  { key: "ENTER", label: "Start session" },
  { key: "ANY KEY", label: "Skip" },
];

const STORAGE_KEY = "mpkcn-booted";
const PASSWORD_LEN = 8;
const TYPE_MS = 40;
const MATRIX_MS = 900;
const FADE_MS = 500;

type Phase = "login" | "matrix" | "done";

function formatClock(d: Date): string {
  const date = d
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .replace(/\./g, "");
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} — ${time}`;
}

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * A tuigreet-style login screen: clock on top, a box with the title set in its
 * border, the username typed in, password dots, "authenticating…", key hints at
 * the bottom, then optional matrix rain, then a fade out.
 * Any key or click skips it. Under prefers-reduced-motion it is skipped entirely.
 * Change its `key` to replay it.
 */
export function BootScreen({
  user = "guest",
  host = "mpkcn.dev",
  hints = DEFAULT_HINTS,
  matrix = true,
  oncePerSession = true,
  fullscreen = true,
  ignoreReducedMotion = false,
  onDone,
  className,
}: BootScreenProps) {
  const [phase, setPhase] = useState<Phase>("login");
  const [instant, setInstant] = useState(false);
  const [typed, setTyped] = useState("");
  const [pwLen, setPwLen] = useState(0);
  const [authenticating, setAuthenticating] = useState(false);
  const [clock, setClock] = useState("");
  const [gone, setGone] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const done = phase === "done";

  // Decide whether to play at all, then run the typing sequence.
  useEffect(() => {
    const reduced = !ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    if (oncePerSession) {
      try {
        seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        // storage blocked: just play
      }
    }
    const timeouts: number[] = [];
    const after = (fn: () => void, ms: number) => {
      timeouts.push(window.setTimeout(fn, ms));
    };
    const clear = () => timeouts.forEach((t) => window.clearTimeout(t));

    if (reduced || seen) {
      after(() => {
        setInstant(true);
        setPhase("done");
      }, 0);
      return clear;
    }

    after(() => setClock(formatClock(new Date())), 0);

    let i = 0;
    const typeUser = () => {
      if (i <= user.length) {
        setTyped(user.slice(0, i));
        i++;
        after(typeUser, TYPE_MS);
      } else {
        after(typePassword, 200);
      }
    };
    let p = 0;
    const typePassword = () => {
      if (p <= PASSWORD_LEN) {
        setPwLen(p);
        p++;
        after(typePassword, TYPE_MS);
      } else {
        setAuthenticating(true);
        after(() => setPhase(matrix && !isLowPower() ? "matrix" : "done"), 350);
      }
    };
    after(typeUser, 250);

    return clear;
    // Runs once per mount; remount (change `key`) to replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Matrix rain stage.
  useEffect(() => {
    if (phase !== "matrix" || !rainRef.current) return;
    const stop = startMatrixRain(rainRef.current);
    const t = window.setTimeout(() => setPhase("done"), MATRIX_MS);
    return () => {
      stop();
      window.clearTimeout(t);
    };
  }, [phase]);

  // Any key or click skips. Fullscreen listens on the window; a preview only on itself.
  useEffect(() => {
    if (done) return;
    const skip = () => setPhase("done");
    const target: Window | HTMLDivElement | null = fullscreen ? window : rootRef.current;
    if (!target) return;
    target.addEventListener("pointerdown", skip);
    target.addEventListener("keydown", skip);
    return () => {
      target.removeEventListener("pointerdown", skip);
      target.removeEventListener("keydown", skip);
    };
  }, [done, fullscreen]);

  // Finish: notify, then unmount the overlay after the fade.
  useEffect(() => {
    if (!done) return;
    // Mark as seen only once finished, so React StrictMode's double mount still plays it.
    if (oncePerSession) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // storage blocked: nothing to remember
      }
    }
    onDoneRef.current?.();
    const t = window.setTimeout(() => setGone(true), instant ? 0 : FADE_MS);
    return () => window.clearTimeout(t);
  }, [done, instant, oncePerSession]);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden={done || undefined}
      aria-label={done ? undefined : "Boot screen. Press any key or click to skip."}
      role={fullscreen ? undefined : "button"}
      tabIndex={fullscreen || done ? undefined : 0}
      className={cx(
        "inset-0 flex items-center justify-center overflow-hidden bg-mpk-bg font-mpk-mono text-mpk-ink",
        "transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none",
        "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-mpk-amber",
        fullscreen ? "fixed z-[100]" : "absolute z-10",
        done && "pointer-events-none invisible opacity-0",
        instant && "transition-none",
        className,
      )}
    >
      {phase === "matrix" ? (
        <canvas ref={rainRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      ) : (
        <>
          <div className="absolute inset-x-0 top-[26px] text-center text-[13px] tracking-[0.05em] text-mpk-ink">
            {clock}
          </div>

          <div className="relative min-w-[min(340px,calc(100%-2rem))] border border-mpk-ink bg-mpk-bg px-[30px] pt-[30px] pb-[22px]">
            <span aria-hidden="true" className="pointer-events-none absolute -top-[9px] -left-[6px] text-base leading-none text-mpk-ink">┌</span>
            <span aria-hidden="true" className="pointer-events-none absolute -top-[9px] -right-[6px] text-base leading-none text-mpk-ink">┐</span>
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-[9px] -left-[6px] text-base leading-none text-mpk-ink">└</span>
            <span aria-hidden="true" className="pointer-events-none absolute -right-[6px] -bottom-[9px] text-base leading-none text-mpk-ink">┘</span>
            <span className="absolute -top-[10px] left-5 bg-mpk-bg px-2 text-xs text-mpk-blue">
              Log in to {host}
            </span>

            <div className="mt-4 flex items-center gap-1.5 text-[13px]">
              <span>Username:</span>
              <span className="tracking-[0.08em]">{typed}</span>
              {typed.length < user.length && (
                <span aria-hidden="true" className="inline-block h-3.5 w-[7px] animate-mpk-blink bg-mpk-blue" />
              )}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[13px]">
              <span>Password:</span>
              <span className="tracking-[0.08em]">{"•".repeat(pwLen)}</span>
              {typed.length >= user.length && pwLen < PASSWORD_LEN && (
                <span aria-hidden="true" className="inline-block h-3.5 w-[7px] animate-mpk-blink bg-mpk-blue" />
              )}
            </div>
            {authenticating && (
              <div className="mt-4 text-xs tracking-[0.04em] text-mpk-blue">authenticating…</div>
            )}
          </div>

          {hints.length > 0 && (
            <div className="absolute inset-x-0 bottom-[22px] flex flex-wrap justify-center gap-x-5 gap-y-2 px-5 text-xs text-mpk-dim">
              {hints.map((h) => (
                <span key={`${h.key}-${h.label}`} className="inline-flex items-center gap-1.5">
                  <span className="border border-mpk-ink px-1.5 py-px text-mpk-ink">{h.key}</span>
                  {h.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
