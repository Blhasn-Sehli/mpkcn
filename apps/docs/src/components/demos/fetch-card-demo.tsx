"use client";

import { useState } from "react";
import { FetchCard, type FetchRow } from "@/registry/fetch-card";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const ART = `
 ███╗   ███╗██████╗ ██╗  ██╗
 ████╗ ████║██╔══██╗██║ ██╔╝
 ██╔████╔██║██████╔╝█████╔╝
 ██║╚██╔╝██║██╔═══╝ ██╔═██╗
 ██║ ╚═╝ ██║██║     ██║  ██╗
 ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝`;

const COMPACT_ART = `
  /\\_/\\
 ( o.o )
  > ^ <`;

const ROWS: FetchRow[] = [
  { label: "os", value: "mpkcn 0.3 x86_64" },
  { label: "shell", value: "zsh 5.9" },
  { label: "stack", value: "Next.js · React · TypeScript" },
  { label: "theme", value: "dark (amber / blue)" },
  { label: "uptime", value: "42 days" },
  { label: "status", value: "open to work" },
];

/** A neofetch-style card with block-letter art, with a Replay button that remounts it. */
export function FetchCardDemo({ compact = false, tone }: { compact?: boolean; tone?: "blue" | "amber" }) {
  const [run, setRun] = useState(0);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="w-full">
      <div className="border border-mpk-line bg-mpk-bg-soft p-4 sm:p-5">
        <FetchCard
          key={run}
          art={compact ? COMPACT_ART : ART}
          artLabel={compact ? "A cat" : "MPK"}
          user="guest"
          host="mpkcn"
          rows={compact ? ROWS.slice(0, 4) : ROWS}
          palette={!compact}
          tone={tone}
          ignoreReducedMotion={force}
          artClassName={compact ? "text-[13px]" : "text-[9px] sm:text-[11px]"}
          className={compact ? "text-xs" : undefined}
        />
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
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
      )}
    </div>
  );
}
