"use client";

import { useId, useRef, useState } from "react";
import { SectionRail } from "@/registry/section-rail";

const SECTIONS = ["intro", "work", "about", "stack", "contact"];

/** A scrollable box of fake sections, tracked by a SectionRail pinned to its right edge. */
export function SectionRailDemo({ compact = false }: { compact?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [active, setActive] = useState(SECTIONS[0]);
  const height = compact ? 220 : 300;

  return (
    <div className="relative w-full border border-mpk-line bg-mpk-bg" style={{ height }}>
      <div ref={box} className="h-full overflow-y-auto pr-14" tabIndex={0} aria-label="Scrollable sample page">
        {SECTIONS.map((id, i) => (
          <section
            key={id}
            id={`${uid}-${id}`}
            className="flex flex-col justify-center gap-2 border-b border-mpk-line px-5 last:border-b-0"
            style={{ minHeight: height * 0.8 }}
          >
            <p className="font-mpk-mono text-[11px] text-mpk-dim2">
              {`// ${String(i + 1).padStart(2, "0")} — ${id}`}
            </p>
            <div className="h-3 w-2/3 border border-mpk-line bg-mpk-bg-soft" />
            <div className="h-3 w-1/2 border border-mpk-line bg-mpk-bg-soft" />
          </section>
        ))}
      </div>
      <SectionRail
        sections={SECTIONS.map((id) => ({ id: `${uid}-${id}`, label: id }))}
        root={box}
        fixed={false}
        onActiveChange={(id) => setActive(id.slice(uid.length + 1))}
        className="absolute top-1/2 right-3 -translate-y-1/2"
      />
      <p className="pointer-events-none absolute bottom-2 left-5 font-mpk-mono text-[11px] text-mpk-dim2">
        active: <span className="text-mpk-blue">{active}</span>
      </p>
    </div>
  );
}
