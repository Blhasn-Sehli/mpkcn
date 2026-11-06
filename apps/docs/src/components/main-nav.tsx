"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Docs", href: "/docs/", match: (p: string) => p.startsWith("/docs") && !p.startsWith("/docs/components") },
  {
    label: "Components",
    href: "/components/",
    match: (p: string) => p.startsWith("/components") || p.startsWith("/docs/components"),
  },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`font-mpk-mono text-[13px] transition-colors ${
              active ? "text-mpk-ink" : "text-mpk-dim hover:text-mpk-ink"
            }`}
          >
            <span aria-hidden="true" className={active ? "text-mpk-amber" : "text-mpk-dim2"}>
              ./
            </span>
            {item.label.toLowerCase()}
          </Link>
        );
      })}
    </nav>
  );
}
