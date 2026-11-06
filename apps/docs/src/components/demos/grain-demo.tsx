"use client";

import { useState } from "react";
import { Grain } from "@/registry/grain";

/** Grain over a sample panel, with an on/off switch and a strength slider. */
export function GrainDemo({ height, compact = false }: { height?: number; compact?: boolean }) {
  const [on, setOn] = useState(true);
  const [intensity, setIntensity] = useState(compact ? 3 : 2);
  const h = height ?? (compact ? 180 : 300);

  return (
    <div className="relative isolate w-full overflow-hidden border border-mpk-line bg-mpk-bg" style={{ height: h }}>
      <div className="absolute inset-0 bg-linear-to-br from-mpk-bg-soft via-mpk-bg to-mpk-bg" />
      <div className="relative flex h-full flex-col justify-center gap-2 p-6 sm:p-10">
        <p className="font-mpk-mono text-[11px] text-mpk-dim2">~/grain</p>
        <p className={`font-semibold tracking-tight text-mpk-ink ${compact ? "text-lg" : "text-2xl"}`}>
          A little texture on <span className="text-mpk-amber">flat</span> colors.
        </p>
        {!compact && <p className="max-w-sm text-sm text-mpk-dim">Static noise in two blend layers, so it reads on dark and light.</p>}
      </div>

      {on && <Grain contained intensity={intensity} />}

      {!compact && (
        <div className="absolute right-3 bottom-3 z-[101] flex items-center gap-3 border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim">
          <label className="flex items-center gap-2">
            intensity
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-20 accent-mpk-blue"
            />
            <span className="w-6 text-mpk-ink tabular-nums">{intensity}</span>
          </label>
          <button
            type="button"
            aria-pressed={on}
            onClick={() => setOn((v) => !v)}
            className="border-l border-mpk-line pl-3 transition-colors hover:text-mpk-blue"
          >
            {on ? "--on" : "--off"}
          </button>
        </div>
      )}
    </div>
  );
}
