"use client";

import { useState } from "react";

export type ImagePlaceholderProps = {
  /** Image URL. When it is missing or fails to load, the striped placeholder shows instead. */
  src?: string;
  /** Alt text for the image. Also the accessible name of the placeholder. */
  alt: string;
  /** Text shown in the placeholder's bottom-left corner. @default "image coming soon" */
  label?: string;
  /** CSS aspect-ratio of the box, e.g. "16 / 10". null lets your className set the size. @default "4 / 5" */
  aspectRatio?: string | null;
  /** Extra classes for the box (width, height, margins). */
  className?: string;
};

/**
 * A framed image slot. Shows the image (cover-fit) when `src` loads; otherwise a
 * diagonal-striped panel with a mono label, so layouts look intentional before
 * the real pictures exist. A broken URL falls back to the placeholder.
 */
export function ImagePlaceholder({
  src,
  alt,
  label = "image coming soon",
  aspectRatio = "4 / 5",
  className,
}: ImagePlaceholderProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  // Catches a load error that happened before hydration (onError would not fire for it).
  const checkImg = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0 && src) setFailedSrc(src);
  };

  return (
    <div
      className={[
        "relative flex items-end overflow-hidden border border-mpk-line bg-linear-155 from-mpk-bg-soft to-mpk-bg to-65%",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={aspectRatio ? { aspectRatio } : undefined}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : alt}
    >
      {showImage ? (
        // A plain <img> keeps the component framework-agnostic; swap in next/image if you like.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={checkImg}
          src={src}
          alt={alt}
          onError={() => setFailedSrc(src ?? null)}
          className="absolute inset-0 block size-full object-cover"
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_18px,color-mix(in_srgb,var(--mpk-ink)_4%,transparent)_18px_19px)]"
          />
          <span aria-hidden="true" className="relative px-3.5 py-3 font-mpk-mono text-xs text-mpk-dim2">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
