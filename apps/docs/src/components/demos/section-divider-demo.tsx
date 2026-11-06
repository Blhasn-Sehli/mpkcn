"use client";

import { useState } from "react";
import { SectionDivider } from "@/registry/section-divider";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

/** Two fake sections with a SectionDivider between them, and a Replay button. */
export function SectionDividerDemo({
  from = "about",
  to = "work",
  compact = false,
}: {
  from?: string;
  to?: string;
  compact?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const block = "h-3 border border-mpk-line bg-mpk-bg-soft";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className={`${block} w-2/3`} />
        {!compact && <div className={`${block} w-1/2`} />}
      </div>
      {/* href={null}: the preview has no real #work section to jump to. */}
      <SectionDivider key={run} from={from} to={to} href={null} ignoreReducedMotion={force} className={compact ? "my-6" : "my-10"} />
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className={`${block} w-1/2`} />
        {!compact && <div className={`${block} w-3/4`} />}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
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
