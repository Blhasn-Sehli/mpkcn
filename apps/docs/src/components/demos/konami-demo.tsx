"use client";

import { useState } from "react";
import { Konami, KONAMI_CODE } from "@/registry/konami";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const GLYPH: Record<string, string> = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };

/** The Konami code as key badges that light up as you type it; the rain fills the box. */
export function KonamiDemo({ compact = false }: { compact?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden border border-mpk-line bg-mpk-bg p-6 font-mpk-mono ${compact ? "min-h-[150px]" : "min-h-[240px]"}`}
    >
      <p className="text-[11px] text-mpk-dim2">type it anywhere on this page</p>
      <div className="flex flex-wrap justify-center gap-1.5" aria-label={`${progress} of ${KONAMI_CODE.length} keys matched`}>
        {KONAMI_CODE.map((k, i) => (
          <kbd
            key={i}
            className={`min-w-7 border px-1.5 py-1 text-center text-xs transition-colors ${
              i < progress ? "border-mpk-blue bg-mpk-blue text-mpk-bg" : "border-mpk-line text-mpk-dim"
            }`}
          >
            {GLYPH[k] ?? k.toUpperCase()}
          </kbd>
        ))}
      </div>
      <p className="text-xs text-mpk-dim" aria-live="polite">
        {count > 0 ? (
          <>
            <span className="text-mpk-amber">&gt;</span> unlocked ×{count}
          </>
        ) : (
          "locked"
        )}
      </p>
      {reduced && !force && !compact && (
        <ReducedMotionNote onPlay={() => setForce(true)} />
      )}
      <Konami
        fullscreen={false}
        onProgress={setProgress}
        onActivate={() => setCount((c) => c + 1)}
        ignoreReducedMotion={force}
      />
    </div>
  );
}
