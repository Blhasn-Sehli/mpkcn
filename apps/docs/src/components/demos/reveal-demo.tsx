"use client";

import { useState } from "react";
import { Reveal, type RevealProps } from "@/registry/reveal";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

type From = NonNullable<RevealProps["from"]>;

const DEFAULT_ITEMS: { from: From; cmd: string; out: string }[] = [
  { from: "up", cmd: "--from up", out: "rises into place" },
  { from: "left", cmd: "--from left", out: "slides in from the left" },
  { from: "right", cmd: "--from right", out: "slides in from the right" },
  { from: "scale", cmd: "--from scale", out: "grows from 94%" },
];

/** A grid of Reveal cards with a Replay button (remounts them via key). */
export function RevealDemo({
  from,
  stagger = 0.12,
  compact = false,
}: {
  /** Show only one direction (all four when omitted). */
  from?: From;
  stagger?: number;
  compact?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const items = from ? DEFAULT_ITEMS.filter((i) => i.from === from) : DEFAULT_ITEMS;

  return (
    <div className="relative w-full">
      <div key={run} className={`grid gap-3 ${items.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {items.map((item, i) => (
          <Reveal key={item.from} from={item.from} delay={i * stagger} once={false} ignoreReducedMotion={force}>
            <div className={`border border-mpk-line bg-mpk-bg-soft ${compact ? "p-3" : "p-4"}`}>
              <p className="font-mpk-mono text-xs text-mpk-dim">
                <span className="text-mpk-amber">$</span> reveal <span className="text-mpk-blue">{item.cmd}</span>
              </p>
              <p className="mt-2 text-sm text-mpk-ink">{item.out}</p>
            </div>
          </Reveal>
        ))}
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
