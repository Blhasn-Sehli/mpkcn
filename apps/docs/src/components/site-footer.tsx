import Link from "next/link";
import { siteConfig } from "@/lib/docs";

export function SiteFooter() {
  return (
    <footer className="border-t border-mpk-line">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-6 font-mpk-mono text-xs text-mpk-dim sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          <span className="text-mpk-ink">MIT</span> <span className="text-mpk-dim2">·</span> built by{" "}
          <a href={siteConfig.github} target="_blank" rel="noreferrer" className="text-mpk-ink underline-offset-4 hover:text-mpk-blue hover:underline">
            MpK
          </a>
        </p>
        <p className="flex items-center gap-4">
          <Link href="/docs/" className="hover:text-mpk-ink">
            docs
          </Link>
          <Link href="/docs/cli/" className="hover:text-mpk-ink">
            cli
          </Link>
          <Link href="/docs/ai/" className="hover:text-mpk-ink">
            ai
          </Link>
          {/* A static file, not a page: a plain link with the base path. */}
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/llms.txt`} className="hover:text-mpk-ink">
            llms.txt
          </a>
          <a href={siteConfig.github} target="_blank" rel="noreferrer" className="hover:text-mpk-ink">
            github
          </a>
          <span className="text-mpk-dim2">v0.1</span>
        </p>
      </div>
    </footer>
  );
}
