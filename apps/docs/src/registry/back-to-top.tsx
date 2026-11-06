"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export type BackToTopProps = {
  /** Scroll container to watch and scroll. Leave empty to use the page. @default undefined (the window) */
  target?: RefObject<HTMLElement | null>;
  /** Pin the button to the bottom-right of the viewport. false places it in the nearest positioned parent instead (use with `target`). @default true */
  fixed?: boolean;
  /** Show the button after this much scroll: a number below 1 is a share of the visible height, otherwise px. @default 0.8 */
  threshold?: number;
  /** Accessible name of the button. @default "Back to top" */
  label?: string;
  /** Element to focus after scrolling up (CSS selector), e.g. "#main" or a skip-link target. Keyboard users then continue from the top. @default undefined */
  focusSelector?: string;
  /** Scroll smoothly even when the user prefers reduced motion (otherwise it jumps). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Button content. @default "↑" */
  children?: ReactNode;
  /** Extra classes for the button. */
  className?: string;
};

/**
 * A small square button that appears once the reader has scrolled down and
 * takes them back to the top. While hidden it is `inert`, so it is out of the
 * tab order and the accessibility tree. Smooth scrolling falls back to an
 * instant jump under reduced motion.
 */
export function BackToTop({
  target,
  fixed = true,
  threshold = 0.8,
  label = "Back to top",
  focusSelector,
  ignoreReducedMotion = false,
  children = "↑",
  className = "",
}: BackToTopProps) {
  const [show, setShow] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    const el = target?.current ?? null;
    const source: HTMLElement | Window = el ?? window;

    const update = () => {
      raf.current = 0;
      const top = el ? el.scrollTop : window.scrollY;
      const view = el ? el.clientHeight : window.innerHeight;
      setShow(top > (threshold < 1 ? view * threshold : threshold));
    };
    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(update);
    };

    schedule();
    source.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      source.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [target, threshold]);

  const goTop = () => {
    const reduced = !ignoreReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduced ? "instant" : "smooth";
    (target?.current ?? window).scrollTo({ top: 0, behavior });
    if (focusSelector) {
      const dest = document.querySelector<HTMLElement>(focusSelector);
      if (dest) {
        if (!dest.hasAttribute("tabindex") && dest.tabIndex < 0) dest.setAttribute("tabindex", "-1");
        dest.focus({ preventScroll: true });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label={label}
      title={label}
      inert={!show}
      className={`right-4 bottom-4 z-[60] grid h-9 min-w-9 place-items-center px-2 border border-mpk-line bg-mpk-bg-soft font-mpk-mono text-base text-mpk-blue transition-[opacity,translate,border-color] duration-200 hover:border-mpk-blue focus-visible:border-mpk-blue focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-blue motion-reduce:transition-none ${
        fixed ? "fixed mb-[env(safe-area-inset-bottom,0px)]" : "absolute"
      } ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"} ${className}`}
    >
      {children}
    </button>
  );
}
