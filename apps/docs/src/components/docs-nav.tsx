"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docSections, docs, normalizePath } from "@/lib/docs";

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalizePath(usePathname());

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-7">
      {docSections.map((section) => (
        <div key={section}>
          <h4 className="mb-2 font-mpk-mono text-[11px] tracking-wider text-mpk-dim2 uppercase">
            <span aria-hidden="true" className="text-mpk-amber">
              #{" "}
            </span>
            {section}
          </h4>
          <ul className="flex flex-col">
            {docs
              .filter((d) => d.section === section)
              .map((doc) => {
                const active = normalizePath(doc.href) === pathname;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={doc.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group relative -ml-px flex items-center border-l py-1.5 pl-4 text-sm transition-colors ${
                        active
                          ? "border-mpk-amber font-medium text-mpk-ink"
                          : "border-mpk-line text-mpk-dim hover:border-mpk-dim2 hover:text-mpk-ink"
                      }`}
                    >
                      {doc.title}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
