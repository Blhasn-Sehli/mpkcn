"use client";

import { useState } from "react";
import { AsciiImage } from "@/registry/ascii-image";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const SAMPLE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos/sample-landscape.svg`;

/** An AsciiImage decoding a sample picture, with a Replay button that remounts it. */
export function AsciiImageDemo({ cell, compact = false }: { cell?: number; compact?: boolean }) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex flex-col items-center gap-4">
      <AsciiImage
        key={run}
        src={SAMPLE}
        alt="Mountains at dusk, flat illustration"
        cell={cell}
        skipOnLowPower={false}
        ignoreReducedMotion={force}
        className={`aspect-[4/5] border border-mpk-line ${compact ? "w-36" : "w-52"}`}
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
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
