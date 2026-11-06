"use client";

import { ParallaxImage, type ParallaxImageProps } from "@/registry/parallax-image";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";
import { useState } from "react";

const SAMPLE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos/sample-landscape.svg`;

/** A framed landscape that follows the pointer over the preview and drifts with scroll. */
export function ParallaxImageDemo({
  compact = false,
  ...props
}: Pick<ParallaxImageProps, "pointer" | "scroll" | "corners" | "pointerArea"> & { compact?: boolean }) {
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ParallaxImage
        src={SAMPLE}
        alt="Mountains at dusk, flat illustration"
        aspectRatio="4 / 3"
        pointerArea="element"
        ignoreReducedMotion={force}
        caption={
          compact ? undefined : (
            <>
              <span>-- NORMAL --</span>
              <span className="text-mpk-blue">scan_ok</span>
            </>
          )
        }
        className={compact ? "w-44" : "w-full max-w-sm"}
        {...props}
      />
      {!compact && reduced && !force && <ReducedMotionNote onPlay={() => setForce(true)} />}
    </div>
  );
}
