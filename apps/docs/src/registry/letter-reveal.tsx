"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import { Fragment, type ElementType } from "react";

export type LetterRevealProps = {
  /** The text to animate. Spaces are kept and words never break mid-word. */
  text: string;
  /** Element to render, e.g. "h1" for a hero heading. @default "span" */
  as?: ElementType;
  /** Seconds before the first letter starts. @default 0 */
  delay?: number;
  /** Seconds between letters. @default 0.035 */
  stagger?: number;
  /** "mount" plays once on load; "view" replays every time the text scrolls into view. @default "mount" */
  trigger?: "mount" | "view";
  /** Hold the letters hidden until this turns true (e.g. after an intro screen ends). Only used with trigger "mount". @default true */
  play?: boolean;
  /** Letters hop up and turn blue on hover. @default true */
  hover?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root element. */
  className?: string;
};

type Custom = { delay: number; stagger: number };

const word: Variants = {
  hidden: {},
  show: (c: Custom) => ({ transition: { staggerChildren: c.stagger, delayChildren: c.delay } }),
};
const letter: Variants = {
  hidden: { opacity: 0, y: "0.7em", rotateX: -80 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

/**
 * Splits text into letters that spring up and flip into place one after another.
 * Screen readers get the plain text once; the letter spans are hidden from them.
 * Under reduced motion the letters only fade in (no movement).
 */
export function LetterReveal({
  text,
  as: Tag = "span",
  delay = 0,
  stagger = 0.035,
  trigger = "mount",
  play = true,
  hover = true,
  ignoreReducedMotion = false,
  className,
}: LetterRevealProps) {
  const on =
    trigger === "view"
      ? { whileInView: "show", viewport: { once: false, amount: 0.8 } }
      : { animate: play ? "show" : "hidden" };
  const words = text.split(" ");

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <MotionConfig reducedMotion={ignoreReducedMotion ? "never" : "user"}>
        <motion.span
          aria-hidden="true"
          className="inline"
          initial="hidden"
          variants={word}
          custom={{ delay, stagger } satisfies Custom}
          {...on}
        >
          {words.map((w, wi) => (
            <Fragment key={wi}>
              {wi > 0 && " "}
              <span className="inline-block whitespace-nowrap [perspective:600px]">
                {[...w].map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    variants={letter}
                    whileHover={hover ? { y: "-0.18em", color: "var(--mpk-blue)", transition: { duration: 0.15 } } : undefined}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            </Fragment>
          ))}
        </motion.span>
      </MotionConfig>
    </Tag>
  );
}
