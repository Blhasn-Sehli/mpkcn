"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export type FeatureListItem = {
  /** Left column, shown bright, e.g. "Runtime". */
  label: ReactNode;
  /** Right column, shown dimmed, e.g. "Node 22". */
  value: ReactNode;
};

export type FeatureListProps = {
  /** Rows to show, top to bottom. */
  items: FeatureListItem[];
  /** Slide the rows in one after another when the list scrolls into view. @default true */
  animate?: boolean;
  /** Seconds between rows. @default 0.08 */
  stagger?: number;
  /** Animate only the first time it scrolls into view. @default true */
  once?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the list. */
  className?: string;
};

const list: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};
const row: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const ROW = "flex justify-between gap-4 border-t border-mpk-line py-2.5 last:border-b";

/**
 * A spec-sheet style list of label / value rows separated by hairlines, in mono.
 * Rendered as a description list (<dl>), so each label is tied to its value.
 * Rows slide in one by one; under reduced motion they only fade.
 */
export function FeatureList({
  items,
  animate = true,
  stagger = 0.08,
  once = true,
  ignoreReducedMotion = false,
  className,
}: FeatureListProps) {
  const cls = ["font-mpk-mono text-[0.95rem] text-mpk-dim", className].filter(Boolean).join(" ");

  const rows = (Row: typeof motion.div | "div") =>
    items.map((f, i) => (
      <Row key={i} className={ROW} {...(Row === "div" ? {} : { variants: row })}>
        <dt className="text-mpk-ink">{f.label}</dt>
        <dd className="m-0 text-right">{f.value}</dd>
      </Row>
    ));

  if (!animate) return <dl className={cls}>{rows("div")}</dl>;

  return (
    <MotionConfig reducedMotion={ignoreReducedMotion ? "never" : "user"}>
      <motion.dl
        className={cls}
        initial="hidden"
        whileInView="show"
        viewport={{ once, amount: 0.3 }}
        variants={list}
        custom={stagger}
      >
        {rows(motion.div)}
      </motion.dl>
    </MotionConfig>
  );
}
