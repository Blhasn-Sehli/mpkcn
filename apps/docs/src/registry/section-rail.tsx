"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

export type SectionRailItem = {
  /** id of the section element on the page. */
  id: string;
  /** Accessible name for the link. @default the id */
  label?: string;
};

export type SectionRailProps = {
  /** Sections in page order. Plain strings are used as ids. */
  sections: (string | SectionRailItem)[];
  /** A section becomes active once its top passes this fraction of the viewport (or scroll container) height. @default 0.4 */
  offset?: number;
  /** Scroll container that holds the sections. Omit to track the window. */
  root?: RefObject<HTMLElement | null>;
  /** Pin the rail to the middle of the viewport edge. false leaves it in the normal flow. @default true */
  fixed?: boolean;
  /** Which edge the rail sits on when fixed (also flips the number/dot order). @default "right" */
  side?: "left" | "right";
  /** Accessible name of the nav landmark. @default "Sections" */
  ariaLabel?: string;
  /** Called with the id of the newly active section. */
  onActiveChange?: (id: string) => void;
  /** Extra classes for the nav. Add e.g. "hidden lg:flex" to hide it on small screens. */
  className?: string;
};

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * A slim vertical rail of square dots, one per page section. The section in view
 * is highlighted (number + filled dot); clicking a dot scrolls to its section.
 * Works with the window or with any scroll container passed as `root`.
 */
export function SectionRail({
  sections,
  offset = 0.4,
  root,
  fixed = true,
  side = "right",
  ariaLabel = "Sections",
  onActiveChange,
  className,
}: SectionRailProps) {
  const items = sections.map((s) => (typeof s === "string" ? { id: s } : s));
  const ids = items.map((s) => s.id).join("|");
  const [active, setActive] = useState(items[0]?.id ?? "");
  const changeRef = useRef(onActiveChange);
  useEffect(() => {
    changeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const list = ids.split("|");
    const scroller: HTMLElement | Window = root?.current ?? window;
    let raf = 0;
    let last: string | undefined;
    const measure = () => {
      raf = 0;
      const box = scroller instanceof Window ? { top: 0, height: window.innerHeight } : scroller.getBoundingClientRect();
      let cur = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - box.top <= box.height * offset) cur = id;
      }
      if (cur !== last) {
        last = cur;
        setActive(cur);
        changeRef.current?.(cur);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, offset, root]);

  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const box = root?.current;
    // Inside a container, scroll only the container (scrollIntoView would also move the page).
    if (box) box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top, behavior });
    else el.scrollIntoView({ behavior, block: "start" });
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cx(
        "z-40 flex flex-col gap-3.5 font-mpk-mono text-[10px]",
        fixed && "fixed top-1/2 -translate-y-1/2",
        fixed && (side === "right" ? "right-[18px]" : "left-[18px]"),
        className,
      )}
    >
      {items.map((s, i) => {
        const on = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => jump(e, s.id)}
            aria-label={s.label ?? s.id}
            aria-current={on ? "location" : undefined}
            className={cx(
              "group flex items-center gap-2 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber",
              side === "right" ? "justify-end" : "flex-row-reverse justify-end",
              on ? "text-mpk-blue" : "text-mpk-dim2 hover:text-mpk-dim",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "transition-opacity duration-200 motion-reduce:transition-none",
                on ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              aria-hidden="true"
              className={cx(
                "size-[7px] border transition-colors duration-200 motion-reduce:transition-none",
                on ? "border-mpk-blue bg-mpk-blue" : "border-mpk-dim2",
              )}
            />
          </a>
        );
      })}
    </nav>
  );
}
