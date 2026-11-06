"use client";

import { useId, useRef, useState } from "react";
import { ScrollHint, type ScrollHintProps } from "@/registry/scroll-hint";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

const VARIANTS: NonNullable<ScrollHintProps["variant"]>[] = ["line", "chevron", "mouse"];

/**
 * A small scrolling "page" with a hero and a ScrollHint at its bottom. The hint
 * watches the box, fades out as it scrolls and jumps to the next section on click.
 */
export function ScrollHintDemo({
  compact = false,
  variant: fixed,
}: {
  compact?: boolean;
  variant?: ScrollHintProps["variant"];
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<NonNullable<ScrollHintProps["variant"]>>(fixed ?? "line");
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const nextId = `next-${id}`;

  return (
    <div className="w-full">
      <div
        ref={boxRef}
        className={`relative overflow-y-auto border border-mpk-line bg-mpk-bg font-mpk-mono ${compact ? "h-40" : "h-64"}`}
      >
        <section className={`relative flex flex-col items-center justify-center gap-1 ${compact ? "h-40" : "h-64"}`}>
          <p className="text-mpk-ink">~/hero</p>
          <p className="text-xs text-mpk-dim">scroll this box</p>
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <ScrollHint
              variant={variant}
              container={boxRef}
              target={`#${nextId}`}
              scrollBlock="nearest"
              ignoreReducedMotion={force}
            />
          </div>
        </section>
        <section id={nextId} className={`border-t border-mpk-line p-4 text-xs text-mpk-dim outline-none ${compact ? "h-40" : "h-64"}`}>
          <span className="text-mpk-amber">$</span> cd ../next-section
        </section>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {reduced && !force && <ReducedMotionNote className="mr-auto" onPlay={() => setForce(true)} />}
          {!fixed && (
            <div role="group" aria-label="Variant" className="flex">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={variant === v}
                  onClick={() => setVariant(v)}
                  className="-ml-px border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim transition-colors first:ml-0 hover:text-mpk-blue aria-pressed:z-10 aria-pressed:border-mpk-blue aria-pressed:text-mpk-blue"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
