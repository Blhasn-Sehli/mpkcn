"use client";

import { ThemeToggle } from "@/registry/theme-toggle";

export function ThemeToggleDemo({ variant }: { variant?: "icon" | "text" | "both" }) {
  const v = variant ?? "both";
  return (
    <div className="flex flex-wrap items-center justify-center gap-10">
      {(v === "icon" || v === "both") && (
        <div className="flex flex-col items-center gap-3">
          <ThemeToggle />
          <span className="font-mpk-mono text-[11px] text-mpk-dim2">variant=&quot;icon&quot;</span>
        </div>
      )}
      {(v === "text" || v === "both") && (
        <div className="flex flex-col items-center gap-3">
          <ThemeToggle variant="text" />
          <span className="font-mpk-mono text-[11px] text-mpk-dim2">variant=&quot;text&quot;</span>
        </div>
      )}
    </div>
  );
}
