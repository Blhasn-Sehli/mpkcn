import type React from "react";
import { DocsNav } from "@/components/docs-nav";
import { SiteFooter } from "@/components/site-footer";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[90rem] flex-1 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-mpk-line py-10 pr-6 lg:block">
          <DocsNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <SiteFooter />
    </>
  );
}
