"use client";

import { useState } from "react";
import { LetterReveal } from "@/registry/letter-reveal";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

/** A heading set with LetterReveal, with a Replay button that remounts it. */
export function LetterRevealDemo({
  text = "Hello, terminal.",
  stagger,
  compact = false,
}: {
  text?: string;
  stagger?: number;
  compact?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="w-full text-center">
      <LetterReveal
        key={run}
        as="p"
        text={text}
        stagger={stagger}
        ignoreReducedMotion={force}
        className={`font-semibold tracking-tight text-mpk-ink ${compact ? "text-3xl" : "text-4xl sm:text-5xl"}`}
      />
      {!compact && <p className="mt-3 font-mpk-mono text-[11px] text-mpk-dim2">hover the letters</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {reduced && !force && (
          <ReducedMotionNote
            onPlay={() => {
              setForce(true);
              setRun((r) => r + 1);
            }}
          />
        )}
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="inline-flex items-center gap-1.5 border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue"
        >
          <ReplayIcon width={12} height={12} />
          replay
        </button>
      </div>
    </div>
  );
}
