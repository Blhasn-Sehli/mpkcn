"use client";

import { useState } from "react";
import { SiteHeader, type SiteHeaderLinkComponentProps, type SiteHeaderProps } from "@/registry/site-header";

// Stand-in for next/link: keeps the demo's logo link from leaving the page.
function DemoLink({ onClick, ...props }: SiteHeaderLinkComponentProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}

const PAGES = ["home", "docs", "blog", "contact"];

/** A SiteHeader stuck to the top of a small scrolling page; click the links to move the marker. */
export function SiteHeaderDemo({ compact = false, ...props }: Partial<SiteHeaderProps> & { compact?: boolean }) {
  const [current, setCurrent] = useState("home");

  return (
    <div className={`relative w-full overflow-y-auto border border-mpk-line bg-mpk-bg ${compact ? "h-40" : "h-72"}`}>
      <SiteHeader
        logo="mysite"
        logoHref="#"
        linkComponent={DemoLink}
        links={PAGES.map((label) => ({ label, onSelect: () => setCurrent(label) }))}
        current={current}
        actions={
          !compact && (
            <button
              type="button"
              className="border border-mpk-line bg-transparent px-2.5 py-1 font-mpk-mono text-[12px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber"
            >
              ⌘K
            </button>
          )
        }
        menuFooter={<span className="font-mpk-mono text-[11px] text-mpk-dim2">esc closes the menu</span>}
        {...props}
      />
      <div className="space-y-3 p-6 font-mpk-mono text-[12px] leading-relaxed text-mpk-dim">
        <p>
          <span className="text-mpk-amber">$</span> cat ~/{current}/index.md
        </p>
        {Array.from({ length: compact ? 3 : 9 }, (_, i) => (
          <p key={i} className="h-3 bg-mpk-bg-soft" style={{ width: `${90 - ((i * 23) % 45)}%` }} />
        ))}
      </div>
    </div>
  );
}
