"use client";

import { useRef } from "react";
import { BackToTop, type BackToTopProps } from "@/registry/back-to-top";

const LINES = Array.from({ length: 40 }, (_, i) => `[${String(i + 1).padStart(2, "0")}] build step ${i + 1} ok`);

/** A scrollable box; the BackToTop button shows up after 120px of scroll. */
export function BackToTopDemo({
  height,
  compact = false,
  ...props
}: Pick<BackToTopProps, "threshold" | "label" | "children"> & { height?: number; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const h = height ?? (compact ? 180 : 300);

  return (
    <div className="relative isolate w-full overflow-hidden border border-mpk-line bg-mpk-bg" style={{ height: h }}>
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label="Scrollable build log"
        className="h-full overflow-y-auto p-5 font-mpk-mono text-xs leading-6 text-mpk-dim focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-mpk-blue"
      >
        <p className="text-mpk-ink">
          <span className="text-mpk-amber">$</span> make build <span className="text-mpk-dim2"># scroll down</span>
        </p>
        {LINES.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <BackToTop target={ref} fixed={false} threshold={120} focusSelector="[aria-label='Scrollable build log']" {...props} />
    </div>
  );
}
