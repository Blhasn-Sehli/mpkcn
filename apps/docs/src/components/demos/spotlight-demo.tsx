"use client";

import { Spotlight, type SpotlightProps } from "@/registry/spotlight";

const PANELS = [
  { cmd: "uptime", out: "up 42 days, load 0.08" },
  { cmd: "git log -1", out: "feat: ship the thing" },
  { cmd: "whoami", out: "guest" },
  { cmd: "df -h /", out: "41% used" },
];

/** A grid of terminal panels, each wrapped in Spotlight. */
export function SpotlightDemo({
  compact = false,
  ...props
}: Pick<SpotlightProps, "color" | "size" | "strength" | "ignoreReducedMotion"> & { compact?: boolean }) {
  const panels = compact ? PANELS.slice(0, 2) : PANELS;
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {panels.map((p) => (
        <Spotlight key={p.cmd} {...props} className={`border border-mpk-line bg-mpk-bg-soft ${compact ? "p-3" : "p-5"}`}>
          <p className="font-mpk-mono text-xs text-mpk-dim">
            <span className="text-mpk-amber">$</span> {p.cmd}
          </p>
          <p className="mt-2 font-mpk-mono text-sm text-mpk-ink">{p.out}</p>
        </Spotlight>
      ))}
    </div>
  );
}
