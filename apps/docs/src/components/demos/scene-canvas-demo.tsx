"use client";

import { useState } from "react";
import { SceneCanvas, type SceneCanvasProps } from "@/registry/scene-canvas";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

type Props = Pick<SceneCanvasProps, "color" | "spacing" | "opacity" | "parallax" | "fps"> & {
  height?: number;
  compact?: boolean;
};

/** A hero-style box with SceneCanvas behind a line of text. */
export function SceneCanvasDemo({ height, compact = false, opacity, ...props }: Props) {
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const h = height ?? (compact ? 180 : 300);

  return (
    <div className="relative isolate w-full overflow-hidden border border-mpk-line bg-mpk-bg" style={{ height: h }}>
      {/* key remounts the canvas so "play anyway" restarts it */}
      <SceneCanvas key={String(force)} ignoreReducedMotion={force} opacity={opacity ?? 0.16} {...props} />
      <div className="relative flex h-full flex-col justify-center gap-2 p-6 sm:p-10">
        <p className="font-mpk-mono text-[11px] text-mpk-dim2">~/hero</p>
        <p className={`font-semibold tracking-tight text-mpk-ink ${compact ? "text-lg" : "text-2xl"}`}>
          Hello, <span className="text-mpk-blue">world</span>.
        </p>
      </div>
      {reduced && !force && (
        <ReducedMotionNote className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]" onPlay={() => setForce(true)} />
      )}
    </div>
  );
}
