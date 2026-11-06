"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True when the visitor prefers reduced motion (false during SSR). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** Small mono note shown in previews when an animation was skipped for reduced motion. */
export function ReducedMotionNote({ onPlay, className = "" }: { onPlay: () => void; className?: string }) {
  return (
    <div
      role="note"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim ${className}`}
    >
      <span>
        <span className="text-mpk-amber">!</span> reduced motion is on — animation skipped
      </span>
      <button
        type="button"
        onClick={onPlay}
        className="text-mpk-blue underline-offset-4 hover:underline"
      >
        play anyway
      </button>
    </div>
  );
}
