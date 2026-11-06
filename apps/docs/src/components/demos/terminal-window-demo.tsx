"use client";

import { useState } from "react";
import { TerminalWindow, type TerminalLine } from "@/registry/terminal-window";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const DEFAULT_LINES: TerminalLine[] = [
  { command: "npx mpkcn add terminal-window", output: "✓ created components/mpkcn/terminal-window.tsx" },
  {
    command: "cat package.json | grep deps",
    output: (
      <>
        <span className="text-mpk-blue">&quot;dependencies&quot;</span>: <span className="text-mpk-amber">0</span>
      </>
    ),
  },
  { command: "echo $SHIP", output: "it types itself. you write the lines." },
];

const COMPACT_LINES: TerminalLine[] = [
  { command: "npx mpkcn add terminal-window", output: "✓ created terminal-window.tsx" },
  { command: "echo ok", output: "ok" },
];

/** TerminalWindow typing a few lines, with a Replay button that remounts it. */
export function TerminalWindowDemo({
  lines,
  title = "~/project — zsh",
  compact = false,
}: {
  lines?: TerminalLine[];
  title?: string;
  compact?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative w-full">
      <TerminalWindow
        key={run}
        title={title}
        lines={lines ?? (compact ? COMPACT_LINES : DEFAULT_LINES)}
        ignoreReducedMotion={force}
        bodyClassName={compact ? "min-h-[120px]" : "min-h-[176px]"}
      />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        {reduced && !force && !compact && (
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
