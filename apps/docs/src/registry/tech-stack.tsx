"use client";

import { AnimatePresence, MotionConfig, motion, type Variants } from "framer-motion";
import { useState, type ReactNode } from "react";

/** A JSON-friendly value shown in the detail panel. */
export type TechDetailValue = string | number | boolean | string[];

export type TechItem = {
  /** Name on the chip, also the key in the detail panel. Unique across the stack. */
  name: string;
  /** Small icon in front of the name (an SVG, an <img>, a letter…). Decorative: hidden from screen readers. */
  icon?: ReactNode;
  /** Key / value pairs for the detail panel, e.g. { since: 2021, used_in: ["app", "api"] }. */
  details?: Record<string, TechDetailValue>;
};

export type TechGroup = {
  /** Category name, e.g. "frontend". */
  label: string;
  items: TechItem[];
};

export type TechStackProps = {
  /** Categories, top to bottom. */
  groups: TechGroup[];
  /** "json" reads like a stack.json file; "grid" shows a heading and a chip grid per category. @default "json" */
  variant?: "json" | "grid";
  /** Command shown above the stack. Pass null to hide it. @default "cat ./stack.json" */
  command?: string | null;
  /** Show the detail panel ("jq" output) for the selected item. @default true */
  detail?: boolean;
  /** Item selected at first. @default the first item */
  defaultSelected?: string;
  /** Called when an item is selected. */
  onSelect?: (item: TechItem, group: TechGroup) => void;
  /** Stagger the chips in when the stack scrolls into view. @default true */
  animate?: boolean;
  /** Animate even when the user prefers reduced motion. Use only behind an explicit action. @default false */
  ignoreReducedMotion?: boolean;
  /** Extra classes for the root. */
  className?: string;
};

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

const EASE = [0.22, 1, 0.36, 1] as const;
const groupV: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: (gi: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE, delay: gi * 0.08, staggerChildren: 0.04, delayChildren: gi * 0.08 + 0.1 },
  }),
};
const chipV: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

const CHIP =
  "inline-flex items-center gap-2 border px-2 py-px font-mpk-mono transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";
const CHIP_OFF = "border-transparent text-mpk-dim hover:border-mpk-line hover:text-mpk-ink";
const CHIP_ON = "border-mpk-blue bg-mpk-blue/10 text-mpk-blue";

function IconSlot({ icon, className }: { icon?: ReactNode; className?: string }) {
  if (icon === undefined || icon === null) return null;
  return (
    <span aria-hidden="true" className={cx("inline-flex shrink-0 items-center justify-center [&>svg]:size-full", className)}>
      {icon}
    </span>
  );
}

function JsonValue({ value }: { value: TechDetailValue }) {
  if (typeof value === "string") return <span className="text-mpk-ink">&quot;{value}&quot;</span>;
  if (typeof value === "number" || typeof value === "boolean")
    return <span className="text-mpk-amber">{String(value)}</span>;
  return null;
}

function Detail({ item, group }: { item: TechItem; group: TechGroup }) {
  const entries: [string, TechDetailValue][] = [["group", group.label], ...Object.entries(item.details ?? {})];
  return (
    <>
      <div className="mb-2 flex items-center gap-2.5 font-mpk-sans text-xl font-semibold tracking-tight text-mpk-ink">
        <IconSlot icon={item.icon} className="size-6 text-mpk-blue" />
        <span className="min-w-0 break-words">{item.name}</span>
      </div>
      <div className="text-mpk-dim2">{"{"}</div>
      <dl className="m-0">
        {entries.map(([k, v], i) => {
          const comma = i < entries.length - 1 ? <span className="text-mpk-dim2">,</span> : null;
          return (
            <div key={k} className="pl-5">
              <dt className="inline text-mpk-blue">&quot;{k}&quot;</dt>
              <span className="text-mpk-dim2">: </span>
              {Array.isArray(v) ? (
                <dd className="inline">
                  <span className="text-mpk-dim2">[{v.length === 0 && "]"}</span>
                  {v.length === 0 && comma}
                  {v.map((s, j) => (
                    <span key={j} className="block pl-5">
                      <span className="text-mpk-ink">&quot;{s}&quot;</span>
                      {j < v.length - 1 && <span className="text-mpk-dim2">,</span>}
                    </span>
                  ))}
                  {v.length > 0 && (
                    <span className="block text-mpk-dim2">
                      ]{comma}
                    </span>
                  )}
                </dd>
              ) : (
                <dd className="inline">
                  <JsonValue value={v} />
                  {comma}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      <div className="text-mpk-dim2">{"}"}</div>
    </>
  );
}

/**
 * A tech stack grouped by category, as a stack.json file or a chip grid. Pick a
 * chip (click, Enter or Space; hovering previews it) and a terminal-style panel
 * prints its details like `jq` would. Two columns when the stack is wide
 * enough (container query), one column otherwise.
 */
export function TechStack({
  groups,
  variant = "json",
  command = "cat ./stack.json",
  detail = true,
  defaultSelected,
  onSelect,
  animate = true,
  ignoreReducedMotion = false,
  className,
}: TechStackProps) {
  const firstName = groups.find((g) => g.items.length > 0)?.items[0]?.name ?? null;
  const [selected, setSelected] = useState<string | null>(defaultSelected ?? firstName);
  const [hovered, setHovered] = useState<string | null>(null);

  const shown = hovered ?? selected;
  let found: { item: TechItem; group: TechGroup } | null = null;
  for (const g of groups) {
    const item = g.items.find((i) => i.name === shown);
    if (item) {
      found = { item, group: g };
      break;
    }
  }

  const pick = (item: TechItem, group: TechGroup) => {
    setSelected(item.name);
    onSelect?.(item, group);
  };

  const json = variant === "json";
  const motionProps = animate
    ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 } }
    : {};

  const chip = (item: TechItem, group: TechGroup, last: boolean) => {
    const on = selected === item.name;
    return (
      <motion.span key={item.name} variants={animate ? chipV : undefined} className="inline-flex items-center">
        <button
          type="button"
          aria-pressed={detail ? on : undefined}
          onClick={() => pick(item, group)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(item.name)}
          onPointerLeave={() => setHovered(null)}
          className={cx(CHIP, on && detail ? CHIP_ON : CHIP_OFF)}
        >
          <IconSlot icon={item.icon} className="size-3.5" />
          <span>{json ? `"${item.name}"` : item.name}</span>
        </button>
        {json && !last && <span className="text-mpk-dim2">,</span>}
      </motion.span>
    );
  };

  return (
    <MotionConfig reducedMotion={ignoreReducedMotion ? "never" : "user"}>
      <div className={cx("@container w-full font-mpk-mono text-[13px] leading-relaxed text-mpk-ink", className)}>
        <div className={cx("grid items-start gap-4", detail && "@2xl:grid-cols-[minmax(0,1fr)_17rem]")}>
          <div className="min-w-0 border border-mpk-line bg-mpk-bg-soft p-4 @md:p-5">
            {command !== null && (
              <div className="mb-3 border-b border-mpk-line pb-3 text-mpk-dim">
                <span className="mr-2 text-mpk-amber">$</span>
                {command}
              </div>
            )}
            {json && <div className="text-mpk-dim2">{"{"}</div>}
            <div className={json ? "pl-4" : "flex flex-col gap-4"}>
              {groups.map((g, gi) => (
                <motion.div
                  key={g.label}
                  role="group"
                  aria-label={g.label}
                  custom={gi}
                  variants={animate ? groupV : undefined}
                  {...motionProps}
                  className={json ? "flex flex-wrap items-center gap-x-0.5 gap-y-0.5" : undefined}
                >
                  {json ? (
                    <span className="mr-1">
                      <span className="text-mpk-blue">&quot;{g.label}&quot;</span>
                      <span className="text-mpk-dim2">: [</span>
                    </span>
                  ) : (
                    <div className="mb-2 text-[11px] tracking-widest text-mpk-dim2 uppercase">{g.label}</div>
                  )}
                  <span className={json ? "contents" : "flex flex-wrap gap-1.5"}>
                    {g.items.map((item, i) => chip(item, g, i === g.items.length - 1))}
                  </span>
                  {json && <span className="text-mpk-dim2">]{gi < groups.length - 1 ? "," : ""}</span>}
                </motion.div>
              ))}
            </div>
            {json && <div className="text-mpk-dim2">{"}"}</div>}
          </div>

          {detail && (
            <div className="min-w-0 border border-mpk-line bg-mpk-bg-soft p-4 @md:p-5 @2xl:sticky @2xl:top-24">
              <div className="mb-3 border-b border-mpk-line pb-3 break-words text-mpk-dim">
                <span className="mr-2 text-mpk-amber">$</span>
                jq &apos;.[&quot;{shown ?? ""}&quot;]&apos;
              </div>
              <div aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={shown ?? "none"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: EASE }}
                  >
                    {found ? (
                      <Detail item={found.item} group={found.group} />
                    ) : (
                      <span className="text-mpk-dim">null</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
