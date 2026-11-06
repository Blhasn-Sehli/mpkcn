"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // The active heading is the last one that has scrolled past the top band.
    const update = () => {
      const offset = 120;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top - offset <= 0) current = el.id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? els[els.length - 1].id : current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="toc-title" className="text-sm">
      <p id="toc-title" className="mb-3 font-mpk-mono text-[11px] tracking-wider text-mpk-dim2 uppercase">
        On this page
      </p>
      <ul className="flex flex-col border-l border-mpk-line">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`-ml-px block border-l py-1 transition-colors ${item.level === 3 ? "pl-7" : "pl-4"} ${
                  isActive ? "border-mpk-amber text-mpk-ink" : "border-transparent text-mpk-dim hover:text-mpk-ink"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
