"use client";

import { useState } from "react";
import { FeatureList, type FeatureListItem } from "@/registry/feature-list";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const ITEMS: FeatureListItem[] = [
  { label: "Stack", value: "Next.js 16 · React 19" },
  { label: "Styling", value: "Tailwind 4" },
  { label: "Motion", value: "framer-motion" },
  { label: "Install", value: "copy the source" },
  { label: "License", value: "MIT" },
];

/** A spec sheet built with FeatureList, with a Replay button that remounts it. */
export function FeatureListDemo({ compact = false }: { compact?: boolean }) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="w-full max-w-md">
      <FeatureList
        key={run}
        items={compact ? ITEMS.slice(0, 4) : ITEMS}
        once={false}
        ignoreReducedMotion={force}
        className={compact ? "text-xs" : "text-sm"}
      />
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
