"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

export type ParallaxImageProps = {
  /** Image URL. Leave it out and pass `children` to move anything else. */
  src?: string;
  /** Alt text for the image. Pass "" for a decorative image. */
  alt?: string;
  /** Content to move instead of an image (a picture, a canvas, an ImagePlaceholder…). Should fill its box. */
  children?: ReactNode;
  /** Largest pointer shift in px, from the center to an edge. 0 turns it off. @default 12 */
  pointer?: number;
  /** What the pointer is measured against. @default "window" */
  pointerArea?: "window" | "element";
  /** Vertical drift in px while the box crosses the viewport. 0 turns it off. @default 40 */
  scroll?: number;
  /** Draw the four viewfinder corners. @default true */
  corners?: boolean;
  /** Bar at the bottom over the image, e.g. a status line. */
  caption?: ReactNode;
  /** CSS aspect-ratio of the box. null lets your className set the size. @default "4 / 5" */
  aspectRatio?: string | null;
  /** Move even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the frame (width, height). */
  className?: string;
};

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReduced() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

const CORNER = "pointer-events-none absolute z-10 size-[18px] border-mpk-blue";

/**
 * An image in a hairline frame that drifts with the pointer (eased, mouse
 * only) and with scroll, on two separate layers. The picture is scaled past
 * the frame by the largest shift, so its edges never show. Reduced motion and
 * touch screens get a still image (scroll drift also stops under reduced motion).
 */
export function ParallaxImage({
  src,
  alt = "",
  children,
  pointer = 12,
  pointerArea = "window",
  scroll = 40,
  corners = true,
  caption,
  aspectRatio = "4 / 5",
  ignoreReducedMotion = false,
  className,
}: ParallaxImageProps) {
  const still = useReduced() && !ignoreReducedMotion;
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [scroll / 2, -scroll / 2]);

  // Pointer layer: eased with requestAnimationFrame, written straight to the DOM.
  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner || still || pointer <= 0) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let tx = 0;
    let ty = 0;
    let x = 0;
    let yy = 0;
    let raf = 0;

    const tick = () => {
      x += (tx - x) * 0.08;
      yy += (ty - yy) * 0.08;
      inner.style.transform = `translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, 0)`;
      raf = Math.abs(tx - x) > 0.05 || Math.abs(ty - yy) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      let px: number;
      let py: number;
      if (pointerArea === "element") {
        const r = frame.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width - 0.5;
        py = (e.clientY - r.top) / r.height - 0.5;
      } else {
        px = e.clientX / window.innerWidth - 0.5;
        py = e.clientY / window.innerHeight - 0.5;
      }
      tx = Math.max(-0.5, Math.min(0.5, px)) * 2 * pointer;
      ty = Math.max(-0.5, Math.min(0.5, py)) * 2 * pointer * 0.7;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    const host: Window | HTMLElement = pointerArea === "element" ? frame : window;
    host.addEventListener("pointermove", onMove as EventListener);
    if (pointerArea === "element") frame.addEventListener("pointerleave", onLeave);
    else document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove as EventListener);
      frame.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      inner.style.transform = "";
    };
  }, [still, pointer, pointerArea]);

  const pad = still ? 0 : Math.max(0, pointer) + Math.max(0, scroll) / 2;

  return (
    <div
      ref={frameRef}
      className={cx("relative isolate overflow-hidden border border-mpk-line bg-mpk-bg-soft", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <motion.div className="absolute inset-0" style={still || scroll <= 0 ? undefined : { y }}>
        <div ref={innerRef} className="absolute will-change-transform" style={{ inset: -pad }}>
          {src ? (
            // A plain <img> keeps the component framework-agnostic; swap in next/image if you like.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} draggable={false} className="block size-full object-cover select-none" />
          ) : (
            children
          )}
        </div>
      </motion.div>

      {corners && (
        <>
          <span aria-hidden="true" className={cx(CORNER, "top-3 left-3 border-t-2 border-l-2")} />
          <span aria-hidden="true" className={cx(CORNER, "top-3 right-3 border-t-2 border-r-2")} />
          <span aria-hidden="true" className={cx(CORNER, "bottom-3 left-3 border-b-2 border-l-2")} />
          <span aria-hidden="true" className={cx(CORNER, "right-3 bottom-3 border-r-2 border-b-2")} />
        </>
      )}

      {caption && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-between gap-3 bg-linear-to-t from-mpk-bg/80 to-transparent px-10 pt-7 pb-3 font-mpk-mono text-xs text-mpk-ink">
          {caption}
        </div>
      )}
    </div>
  );
}
