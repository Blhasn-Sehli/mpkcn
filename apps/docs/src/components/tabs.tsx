"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export type TabItem = { label: string; content: ReactNode };

/** Accessible tabs (roving focus, arrow keys). Panels stay mounted so demos keep their state. */
export function Tabs({
  items,
  className = "",
  listClassName = "",
  panelClassName = "",
  ariaLabel,
}: {
  items: TabItem[];
  className?: string;
  listClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = active;
    if (e.key === "ArrowRight") next = (active + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (active - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={`flex items-center ${listClassName}`}>
        {items.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.label}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={`relative -mb-px h-10 px-3 font-mpk-mono text-xs transition-colors ${
                selected ? "text-mpk-ink" : "text-mpk-dim hover:text-mpk-ink"
              }`}
            >
              {selected && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-px bg-mpk-amber" />}
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, i) => (
        <div
          key={item.label}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          className={panelClassName}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
