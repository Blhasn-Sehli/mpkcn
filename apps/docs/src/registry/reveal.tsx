"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealFrom = "up" | "left" | "right" | "scale";

export type RevealProps = {
  /** Content to reveal. */
  children: ReactNode;
  /** Direction the content comes in from. @default "up" */
  from?: RevealFrom;
  /** Delay before the animation starts, in seconds. @default 0 */
  delay?: number;
  /** Animate only the first time it scrolls into view. @default true */
  once?: boolean;
  /** Animate even when the user prefers reduced motion (e.g. behind an explicit "play" button). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the wrapper div. */
  className?: string;
};

type Custom = { delay: number; from: RevealFrom };

const offset: Record<RevealFrom, { x?: number; y?: number; scale?: number }> = {
  up: { y: 28 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.94, y: 12 },
};

const variants: Variants = {
  hidden: (c: Custom) => ({ opacity: 0, ...offset[c.from] }),
  show: (c: Custom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: c.delay },
  }),
};

/**
 * Fades and slides its children in when they scroll into view.
 * Under prefers-reduced-motion nothing moves: position and scale snap into place
 * and only the opacity fades. The server and client render the same markup, so
 * there is no hydration mismatch.
 */
export function Reveal({
  children,
  from = "up",
  delay = 0,
  once = true,
  ignoreReducedMotion = false,
  className,
}: RevealProps) {
  return (
    <MotionConfig reducedMotion={ignoreReducedMotion ? "never" : "user"}>
      <motion.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once, amount: 0.2 }}
        variants={variants}
        custom={{ delay, from } satisfies Custom}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
