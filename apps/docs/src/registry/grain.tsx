import type { CSSProperties } from "react";

export type GrainProps = {
  /** Fill the nearest positioned parent instead of covering the whole viewport as a fixed overlay. @default false */
  contained?: boolean;
  /** Strength multiplier: 1 is the subtle default, 2 doubles it, 0 hides it. @default 1 */
  intensity?: number;
  /** Size of the repeating noise tile in px. Smaller is finer grain. @default 160 */
  size?: number;
  /** Extra classes for both noise layers (e.g. a different z-index). */
  className?: string;
};

// Grayscale fractal noise with boosted contrast, as an SVG tile. The browser
// rasterises it once as a background image, so it costs nothing per frame (no
// CSS `filter` on a full-screen layer) and needs no element ids.
const NOISE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="2.4" intercept="-0.7"/><feFuncG type="linear" slope="2.4" intercept="-0.7"/><feFuncB type="linear" slope="2.4" intercept="-0.7"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
);

/**
 * A static film-grain overlay. Two noise layers are stacked: a "screen" layer
 * that lifts dark pixels and a "multiply" layer that darkens light ones, so the
 * texture stays visible on both the dark and the light theme. It never moves,
 * never catches clicks and is hidden from assistive technology and print.
 */
export function Grain({ contained = false, intensity = 1, size = 160, className = "" }: GrainProps) {
  // The layers sit directly in the page (no wrapper) so their blend modes mix
  // with the content underneath instead of an isolated group.
  const style = {
    "--mpk-grain": Math.max(0, intensity),
    backgroundImage: `url("data:image/svg+xml,${NOISE}")`,
    backgroundSize: `${size}px ${size}px`,
  } as CSSProperties;
  const base = `pointer-events-none inset-0 z-[100] print:hidden ${contained ? "absolute" : "fixed"}`;

  return (
    <>
      <div
        aria-hidden="true"
        style={style}
        className={`${base} opacity-[calc(var(--mpk-grain)*0.04)] mix-blend-screen [.light_&]:opacity-[calc(var(--mpk-grain)*0.02)] ${className}`}
      />
      <div
        aria-hidden="true"
        style={style}
        className={`${base} opacity-[calc(var(--mpk-grain)*0.02)] mix-blend-multiply [.light_&]:opacity-[calc(var(--mpk-grain)*0.05)] ${className}`}
      />
    </>
  );
}
