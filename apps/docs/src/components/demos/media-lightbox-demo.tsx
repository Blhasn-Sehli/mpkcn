"use client";

import { useState } from "react";
import { MediaLightbox, type LightboxItem, type MediaLightboxProps } from "@/registry/media-lightbox";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos`;

export const LIGHTBOX_SAMPLES: LightboxItem[] = [
  { src: `${BASE}/sample-dunes.svg`, alt: "Dunes under an orange sky, flat illustration", caption: "dunes.svg" },
  { src: `${BASE}/sample-grid.svg`, alt: "Two boxes labelled api and web on a grid", caption: "diagram.svg" },
  { src: `${BASE}/sample-night.svg`, alt: "A city skyline at night with a full moon", caption: "night.svg" },
  { src: `${BASE}/sample-landscape.svg`, alt: "Mountains at dusk, flat illustration", caption: "dusk.svg" },
];

/**
 * A row of thumbnails; clicking one opens the lightbox inside the preview box
 * (portal={false}), so it never covers the docs page.
 */
export function MediaLightboxDemo({ compact = false, ...props }: Partial<MediaLightboxProps> & { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const [seen, setSeen] = useState(0);
  const items = compact ? LIGHTBOX_SAMPLES.slice(0, 3) : LIGHTBOX_SAMPLES;

  return (
    <div className={`relative w-full overflow-hidden border border-mpk-line bg-mpk-bg ${compact ? "h-52" : "h-[420px]"}`}>
      <div className="flex h-full flex-col justify-center gap-3 p-4">
        <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
          {items.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => {
                setStart(i);
                setOpen(true);
              }}
              aria-label={`Open ${item.caption} in the lightbox`}
              className={`aspect-[16/10] overflow-hidden border bg-mpk-bg-soft transition-colors hover:border-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber ${
                i === seen ? "border-mpk-amber" : "border-mpk-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
        <p className="m-0 font-mpk-mono text-[11px] text-mpk-dim2">
          <span className="text-mpk-amber">$</span> open ./gallery {compact ? "" : "· click a picture, then ← → and esc"}
        </p>
      </div>
      <MediaLightbox
        items={items}
        open={open}
        onOpenChange={setOpen}
        startIndex={start}
        onIndexChange={setSeen}
        title="~/gallery"
        portal={false}
        thumbnails={!compact}
        {...props}
      />
    </div>
  );
}
