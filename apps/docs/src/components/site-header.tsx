import Link from "next/link";
import { siteConfig } from "@/lib/docs";
import { getSearchIndex } from "@/lib/toc";
import { ThemeToggle } from "@/registry/theme-toggle";
import { CommandPalette } from "./command-palette";
import { GitHubIcon } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  const entries = getSearchIndex();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-mpk-line bg-mpk-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-mpk-bg/70">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav />
        <Logo />
        <Link
          href="/docs/changelog/"
          aria-label={`Version ${siteConfig.version}, see the changelog`}
          className="mr-4 hidden border border-mpk-line px-1.5 py-px font-mpk-mono text-[10px] leading-4 text-mpk-dim transition-colors hover:border-mpk-amber hover:text-mpk-amber sm:inline-block"
        >
          v{siteConfig.version}
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CommandPalette entries={entries} />
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="mpkcn on GitHub"
            className="inline-grid size-[34px] place-items-center text-mpk-dim transition-colors hover:text-mpk-ink"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
