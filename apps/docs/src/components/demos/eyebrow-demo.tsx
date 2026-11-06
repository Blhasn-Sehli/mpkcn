"use client";

import { useState } from "react";
import { Eyebrow } from "@/registry/eyebrow";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

/** An Eyebrow above a heading, with a Replay button that remounts it. */
export function EyebrowDemo({
  text = "// 02 — selected work",
  compact = false,
}: {
  text?: string;
  compact?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="w-full">
      <div key={run} className={`border border-mpk-line bg-mpk-bg-soft ${compact ? "p-4" : "p-6"}`}>
        <Eyebrow text={text} ignoreReducedMotion={force} className="mb-3" />
        <h3 className={`font-semibold tracking-tight text-mpk-ink ${compact ? "text-lg" : "text-2xl"}`}>Things I built</h3>
        {!compact && <p className="mt-2 text-sm text-mpk-dim">The label types itself each time it scrolls into view.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {reduced && !force && (
          <ReducedMotionNote
            className="mr-auto"
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
