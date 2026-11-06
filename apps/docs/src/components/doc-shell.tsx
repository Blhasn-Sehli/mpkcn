import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDoc, getPager } from "@/lib/docs";
import { getHeadings } from "@/lib/toc";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";
import { Toc } from "./toc";

export function docMetadata(slug: string): Metadata {
  const doc = getDoc(slug);
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: doc.href.slice(1) },
    openGraph: { title: `${doc.title} — mpkcn`, description: doc.description, url: doc.href.slice(1) },
  };
}

export function DocShell({ slug, children }: { slug: string; children: ReactNode }) {
  const doc = getDoc(slug);
  const toc = getHeadings(slug);
  const { prev, next } = getPager(slug);
  const crumb = doc.section === "Components" ? "components" : "docs";

  return (
    <div className="flex gap-12 xl:gap-16">
      <article className="min-w-0 flex-1 py-10 lg:pl-12 xl:max-w-[46rem]">
        <p className="mb-4 font-mpk-mono text-xs text-mpk-dim2">
          <span className="text-mpk-amber">~</span>/{crumb}/<span className="text-mpk-dim">{doc.slug}</span>
        </p>
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-mpk-ink sm:text-[2.35rem]">{doc.title}</h1>
        <p className="mt-3 text-[1.05rem] leading-7 text-mpk-dim">{doc.description}</p>

        <div className="mt-10">{children}</div>

        <nav aria-label="Pagination" className="mt-16 grid gap-3 border-t border-mpk-line pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex flex-col gap-1 border border-mpk-line p-4 transition-colors hover:border-mpk-dim2"
            >
              <span className="flex items-center gap-1.5 font-mpk-mono text-[11px] text-mpk-dim2">
                <ArrowLeftIcon width={12} height={12} /> prev
              </span>
              <span className="text-sm font-medium text-mpk-ink group-hover:text-mpk-blue">{prev.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next && (
            <Link
              href={next.href}
              className="group flex flex-col items-end gap-1 border border-mpk-line p-4 text-right transition-colors hover:border-mpk-dim2"
            >
              <span className="flex items-center gap-1.5 font-mpk-mono text-[11px] text-mpk-dim2">
                next <ArrowRightIcon width={12} height={12} />
              </span>
              <span className="text-sm font-medium text-mpk-ink group-hover:text-mpk-blue">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-10">
          <Toc items={toc} />
        </div>
      </aside>
    </div>
  );
}
