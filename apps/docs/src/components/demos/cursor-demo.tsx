"use client";

import { useState, useSyncExternalStore } from "react";
import { Cursor, type CursorProps } from "@/registry/cursor";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const COARSE = "(hover: none), (pointer: coarse)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True on touch screens and other coarse pointers (false during SSR). */
function useCoarsePointer() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COARSE).matches,
    () => false,
  );
}

type Props = Pick<CursorProps, "magnetic" | "hideNativeCursor" | "lag"> & {
  height?: number;
  compact?: boolean;
};

/** A contained Cursor over a few magnetic buttons and a text field. */
export function CursorDemo({ height, compact = false, hideNativeCursor = true, ...props }: Props) {
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const h = height ?? (compact ? 180 : 300);

  return (
    <div
      className="relative isolate flex w-full flex-col items-center justify-center gap-5 overflow-hidden border border-mpk-line bg-mpk-bg p-6"
      style={{ height: h }}
    >
      <p className="font-mpk-mono text-xs text-mpk-dim">
        <span className="text-mpk-amber">$</span> move the pointer in here
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {["deploy", "logs", ...(compact ? [] : ["rollback"])].map((cmd) => (
          <button
            key={cmd}
            type="button"
            data-magnetic
            className="border border-mpk-line bg-mpk-bg-soft px-3 py-1.5 font-mpk-mono text-xs text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue"
          >
            {cmd}
          </button>
        ))}
      </div>
      {!compact && (
        <label className="flex w-full max-w-64 flex-col gap-1.5 font-mpk-mono text-[11px] text-mpk-dim2">
          text fields keep the system cursor
          <input
            type="text"
            placeholder="type here…"
            className="border border-mpk-line bg-mpk-bg-soft px-2.5 py-1.5 text-xs text-mpk-ink placeholder:text-mpk-dim2 focus-visible:border-mpk-blue focus-visible:outline-none"
          />
        </label>
      )}

      <Cursor contained hideNativeCursor={hideNativeCursor} ignoreReducedMotion={force} {...props} />

      {coarse ? (
        <p role="note" className="absolute bottom-3 left-3 font-mpk-mono text-[11px] text-mpk-dim">
          <span className="text-mpk-amber">!</span> touch screen detected: the cursor turns itself off
        </p>
      ) : (
        reduced &&
        !force && <ReducedMotionNote className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]" onPlay={() => setForce(true)} />
      )}
    </div>
  );
}
