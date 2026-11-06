"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";

export type LightboxItem = {
  /** Image or video URL. */
  src: string;
  /** "video" plays it with native controls. @default "image" */
  type?: "image" | "video";
  /** Alt text for an image (also the name of its thumbnail). @default the caption, then "Image n" */
  alt?: string;
  /** Poster frame for a video, also used as its thumbnail. */
  poster?: string;
  /** Short label shown in the top bar, e.g. "home screen". */
  caption?: string;
};

export type MediaLightboxProps = {
  /** Images and videos, in order. */
  items: LightboxItem[];
  /** Whether the lightbox is shown. */
  open: boolean;
  /** Called when it wants to close (Esc, ✕, a click on the backdrop). */
  onOpenChange: (open: boolean) => void;
  /** Item shown first each time it opens. @default 0 */
  startIndex?: number;
  /** Called whenever the shown item changes, e.g. to sync a gallery behind it. */
  onIndexChange?: (index: number) => void;
  /** Title in the top bar and accessible name of the dialog. @default "Media" */
  title?: string;
  /** Wrap from the last item to the first and back. @default true */
  loop?: boolean;
  /** Show a strip of thumbnails at the bottom. @default true */
  thumbnails?: boolean;
  /** Click an image to zoom 2× on that spot. @default true */
  zoom?: boolean;
  /** Render into document.body as a fullscreen overlay. Set to false to fill the nearest positioned parent instead. @default true */
  portal?: boolean;
  /** Extra classes for the dialog. */
  className?: string;
};

const FOCUS = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";
const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function labelOf(item: LightboxItem, i: number): string {
  return item.alt ?? item.caption ?? `${item.type === "video" ? "Video" : "Image"} ${i + 1}`;
}

const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * An accessible image and video lightbox: arrows, ← → Home End and Esc, swipe,
 * thumbnails and click-to-zoom. Focus moves into the dialog, stays trapped
 * there and goes back where it was on close. With `portal={false}` it fills
 * its positioned parent instead of the screen.
 */
export function MediaLightbox(props: MediaLightboxProps) {
  const mounted = useMounted();
  if (!props.open || !mounted || props.items.length === 0) return null;
  const panel = <Panel {...props} />;
  return props.portal === false ? panel : createPortal(panel, document.body);
}

// Mounted fresh on every open, so it starts at `startIndex` with zoom off.
function Panel({
  items,
  onOpenChange,
  startIndex = 0,
  onIndexChange,
  title = "Media",
  loop = true,
  thumbnails = true,
  zoom: canZoom = true,
  portal = true,
  className,
}: MediaLightboxProps) {
  const n = items.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), n - 1));
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const downX = useRef<number | null>(null);
  const swiped = useRef(false);
  const titleId = useId();
  const i = Math.min(index, n - 1);
  const item = items[i];

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const show = useCallback(
    (next: number) => {
      const target = loop ? (next + n) % n : Math.min(n - 1, Math.max(0, next));
      setZoom(null);
      setIndex(target);
      onIndexChange?.(target);
    },
    [loop, n, onIndexChange],
  );

  // Focus the close button, lock page scroll (fullscreen only), give focus back on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const html = document.documentElement;
    const overflow = html.style.overflow;
    if (portal) html.style.overflow = "hidden";
    return () => {
      if (portal) html.style.overflow = overflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [portal]);

  // Keep the active thumbnail in view without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[i] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [i]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const inVideo = (e.target as HTMLElement).tagName === "VIDEO";
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && !inVideo) show(i + 1);
    else if (e.key === "ArrowLeft" && !inVideo) show(i - 1);
    else if (e.key === "Home" && !inVideo) show(0);
    else if (e.key === "End" && !inVideo) show(n - 1);
    else if (e.key === "Tab") {
      // Focus trap: cycle through the focusable elements of the dialog.
      const nodes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === rootRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    downX.current = e.clientX;
    swiped.current = false;
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = downX.current === null ? 0 : e.clientX - downX.current;
    downX.current = null;
    if (!zoom && n > 1 && Math.abs(d) > 60) {
      swiped.current = true;
      show(d < 0 ? i + 1 : i - 1);
    }
  }

  function onImageClick(e: MouseEvent<HTMLDivElement>) {
    if (swiped.current || !canZoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom(zoom ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  const atStart = !loop && i === 0;
  const atEnd = !loop && i === n - 1;
  const navBtn = cx(
    "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center border border-mpk-line bg-mpk-bg/80 font-mpk-mono text-xl text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue disabled:pointer-events-none disabled:opacity-30",
    FOCUS,
  );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cx(
        "z-[100] flex flex-col bg-mpk-bg/95 font-mpk-mono text-mpk-ink outline-none backdrop-blur-sm",
        portal ? "fixed inset-0" : "absolute inset-0",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-mpk-line px-4 py-2.5 text-[12px]">
        <span id={titleId} className="truncate text-mpk-ink">
          {title}
        </span>
        {item.caption && <span className="truncate text-mpk-dim max-sm:hidden">{item.caption}</span>}
        <span className="ml-auto shrink-0 text-mpk-amber">
          {i + 1}/{n}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className={cx("grid size-7 shrink-0 place-items-center border border-mpk-line bg-transparent text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue", FOCUS)}
        >
          ✕
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-pan-y overflow-hidden"
        onClick={(e) => e.target === e.currentTarget && !swiped.current && close()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {item.type === "video" ? (
          <div className="pointer-events-none absolute inset-4 flex items-center justify-center">
            <video
              key={item.src}
              src={item.src}
              poster={item.poster}
              controls
              playsInline
              aria-label={labelOf(item, i)}
              className="pointer-events-auto max-h-full max-w-full bg-mpk-bg"
            />
          </div>
        ) : (
          <div
            key={item.src}
            onClick={onImageClick}
            className={cx(
              "absolute inset-4 transition-transform duration-300 ease-out motion-reduce:transition-none",
              canZoom && (zoom ? "scale-200 cursor-zoom-out" : "cursor-zoom-in"),
            )}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          >
            {/* A plain <img> keeps the component framework-agnostic; swap in next/image if you like. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={labelOf(item, i)} draggable={false} className="size-full object-contain select-none" />
          </div>
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => show(i - 1)} disabled={atStart} aria-label="Previous" className={cx(navBtn, "left-3")}>
              ‹
            </button>
            <button type="button" onClick={() => show(i + 1)} disabled={atEnd} aria-label="Next" className={cx(navBtn, "right-3")}>
              ›
            </button>
          </>
        )}
      </div>

      {thumbnails && n > 1 && (
        <div ref={stripRef} className="flex gap-2 overflow-x-auto border-t border-mpk-line px-4 py-2.5 [scrollbar-width:thin]">
          {items.map((t, k) => {
            const thumb = t.type === "video" ? t.poster : t.src;
            return (
              <button
                key={`${k}-${t.src}`}
                type="button"
                onClick={() => show(k)}
                aria-label={labelOf(t, k)}
                aria-current={k === i || undefined}
                className={cx(
                  "relative h-12 w-[72px] shrink-0 overflow-hidden border bg-mpk-bg-soft transition-colors",
                  k === i ? "border-mpk-amber" : "border-mpk-line opacity-60 hover:opacity-100",
                  FOCUS,
                )}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" draggable={false} className="size-full object-cover" />
                )}
                {t.type === "video" && (
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-[11px] text-mpk-ink">
                    ▶
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div aria-hidden="true" className="border-t border-mpk-line px-4 py-1.5 text-[11px] text-mpk-dim2 max-sm:hidden">
        ← → move · home end · {canZoom ? "click to zoom · " : ""}esc close
      </div>
      <div aria-live="polite" className="sr-only">
        {labelOf(item, i)}, {i + 1} of {n}
      </div>
    </div>
  );
}
