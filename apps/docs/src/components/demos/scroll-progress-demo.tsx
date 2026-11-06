"use client";

import { useRef } from "react";
import { ScrollProgress, type ScrollProgressProps } from "@/registry/scroll-progress";

const LINES = Array.from({ length: 40 }, (_, i) => `[${String(i + 1).padStart(2, "0")}] log line ${i + 1}: all systems nominal`);

/** A scrollable log box with a ScrollProgress bar tracking it. */
export function ScrollProgressDemo({
  height,
  compact = false,
  ...props
}: Pick<ScrollProgressProps, "color" | "position" | "thickness"> & { height?: number; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const h = height ?? (compact ? 180 : 300);

  return (
    <div className="relative isolate w-full overflow-hidden border border-mpk-line bg-mpk-bg" style={{ height: h }}>
      <ScrollProgress target={ref} fixed={false} {...props} />
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label="Scrollable log"
        className="h-full overflow-y-auto p-5 font-mpk-mono text-xs leading-6 text-mpk-dim focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-mpk-blue"
      >
        <div>
          <p className="text-mpk-ink">
            <span className="text-mpk-amber">$</span> tail -n 40 app.log <span className="text-mpk-dim2"># scroll me</span>
          </p>
          {LINES.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
