"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useState, useSyncExternalStore, type MouseEvent, type RefObject } from "react";

export type ScrollHintProps = {
  /** Mono text next to the indicator. Pass "" to hide it. @default "scroll" */
  label?: string;
  /** "line": a block running down a hairline. "chevron": a bouncing arrow. "mouse": a mouse with a moving wheel. @default "line" */
  variant?: "line" | "chevron" | "mouse";
  /** Where a click scrolls to: a selector such as "#work". Turns the hint into a link. */
  target?: string;
  /** How the target lines up after the scroll (scrollIntoView `block`). @default "start" */
  scrollBlock?: ScrollLogicalPosition;
  /** Called on click. Turns the hint into a button when there is no `target`. */
  onClick?: () => void;
  /** Accessible name when it is a link or a button. @default "Scroll down" */
  ariaLabel?: string;
  /** Pixels scrolled before it has fully faded out. null keeps it visible. @default 80 */
  hideAfter?: number | null;
  /** Scroll container to watch instead of the page. */
  container?: RefObject<HTMLElement | null>;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root. */
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

const LOOP = { duration: 1.6, ease: [0.65, 0, 0.35, 1] as const, repeat: Infinity };

function Indicator({ variant, still }: { variant: "line" | "chevron" | "mouse"; still: boolean }) {
  if (variant === "chevron") {
    return (
      <motion.svg
        viewBox="0 0 24 24"
        className="size-5 text-mpk-blue"
        animate={still ? undefined : { y: [0, 6, 0] }}
        transition={LOOP}
      >
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </motion.svg>
    );
  }
  if (variant === "mouse") {
    return (
      <span className="relative flex h-7 w-[18px] justify-center border border-mpk-dim2 pt-1.5">
        <motion.span
          className="block h-1.5 w-0.5 bg-mpk-blue"
          animate={still ? undefined : { y: [0, 8], opacity: [1, 0] }}
          transition={{ ...LOOP, ease: "easeIn" }}
        />
      </span>
    );
  }
  return (
    <span className="relative block h-10 w-px overflow-hidden bg-mpk-line">
      <motion.span
        className="absolute inset-x-0 top-0 block h-3 bg-mpk-blue"
        initial={false}
        animate={still ? { y: 14 } : { y: [-12, 40] }}
        transition={still ? { duration: 0 } : LOOP}
      />
    </span>
  );
}

/**
 * An animated "scroll down" indicator for the bottom of a hero. It fades out
 * as the page (or a container) scrolls, and can scroll to a target on click.
 * Under reduced motion the indicator holds still.
 */
export function ScrollHint({
  label = "scroll",
  variant = "line",
  target,
  scrollBlock = "start",
  onClick,
  ariaLabel = "Scroll down",
  hideAfter = 80,
  container,
  ignoreReducedMotion = false,
  className,
}: ScrollHintProps) {
  const still = useReduced() && !ignoreReducedMotion;
  const { scrollY } = useScroll(container ? { container } : undefined);
  const fade = hideAfter !== null && hideAfter > 0;
  const opacity = useTransform(scrollY, [0, fade ? hideAfter : 1], fade ? [1, 0] : [1, 1]);
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(opacity, "change", (v) => setHidden(v < 0.05));

  const cls = cx(
    "inline-flex flex-col items-center gap-2 font-mpk-mono text-[11px] tracking-widest text-mpk-dim2 lowercase",
    (target || onClick) &&
      "transition-colors hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-mpk-amber",
    hidden && "pointer-events-none",
    className,
  );
  const body = (
    <>
      {label && <span aria-hidden={target || onClick ? true : undefined}>{label}</span>}
      <span aria-hidden="true">
        <Indicator variant={variant} still={still} />
      </span>
    </>
  );

  const handleClick = (e: MouseEvent) => {
    onClick?.();
    if (!target) return;
    let el: Element | null = null;
    try {
      el = document.querySelector(target);
    } catch {
      return;
    }
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: scrollBlock });
    if (el instanceof HTMLElement) {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
  };

  if (target) {
    return (
      <motion.a
        href={target}
        onClick={handleClick}
        aria-label={ariaLabel}
        tabIndex={hidden ? -1 : undefined}
        style={{ opacity }}
        className={cls}
      >
        {body}
      </motion.a>
    );
  }
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        tabIndex={hidden ? -1 : undefined}
        style={{ opacity }}
        className={cls}
      >
        {body}
      </motion.button>
    );
  }
  return (
    <motion.div aria-hidden="true" style={{ opacity }} className={cls}>
      {body}
    </motion.div>
  );
}
