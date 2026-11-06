import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";
import { BootScreenDemo } from "@/components/demos/boot-screen-demo";
import { RevealDemo } from "@/components/demos/reveal-demo";
import { ThemeToggleDemo } from "@/components/demos/theme-toggle-demo";
import { ArrowRightIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig, testedVersions } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "mpkcn — Terminal-style components you copy, paste and own" },
  description: siteConfig.description,
};

const INSTALL = "npx mpkcn add boot-screen";

const features: { flag: string; title: string; body: string }[] = [
  {
    flag: "--own",
    title: "You own the code",
    body: "One command copies readable source into your repo. No package to upgrade, no API to work around.",
  },
  {
    flag: "--tokens",
    title: "Eight CSS variables",
    body: "Every color is an --mpk-* token exposed as a Tailwind 4 utility. Retheme with a few lines of CSS.",
  },
  {
    flag: "--dark",
    title: "Dark first, light ready",
    body: "Dark by default with a tuned light palette, switched by next-themes with no hydration flash.",
  },
  {
    flag: "--a11y",
    title: "Reduced motion respected",
    body: "Visible focus, labelled buttons, and every animation calms down under prefers-reduced-motion.",
  },
  {
    flag: "--cli",
    title: "Tiny, safe CLI",
    body: "Node 22, zero runtime deps. Resolves dependencies, never overwrites by default, rejects unsafe paths.",
  },
  {
    flag: "--latest",
    title: "Latest stable stack",
    body: `Tested with React ${testedVersions.react}, Next.js ${testedVersions.next} and Tailwind CSS 4.`,
  },
];

function TerminalWindow() {
  const created = (k: number, file: string) => (
    <Fragment key={k}>
      <span className="text-mpk-blue">{"  created    "}</span>src/components/mpkcn/<span className="text-mpk-ink">{file}</span>
    </Fragment>
  );
  const lines: ReactNode[] = [
    <Fragment key={0}>
      <span className="text-mpk-amber">$</span> <span className="text-mpk-ink">npx mpkcn add boot-screen</span>
    </Fragment>,
    <span key={1} className="text-mpk-dim">Adding boot-screen (+ theme)</span>,
    created(6, "mpkcn-theme.css"),
    created(7, "boot-screen.tsx"),
    created(8, "lib/matrix-rain.ts"),
    <span key={2} className="text-mpk-dim2">&nbsp;</span>,
    <span key={3} className="text-mpk-dim2">Tip: import the theme once in your global CSS</span>,
    <Fragment key={4}>
      <span className="text-mpk-ink">{"  "}@import</span> <span className="text-mpk-amber">&quot;src/components/mpkcn/mpkcn-theme.css&quot;</span>;
    </Fragment>,
    <Fragment key={5}>
      <span className="text-mpk-amber">$</span>{" "}
      <span aria-hidden="true" className="inline-block h-[1.05em] w-[0.55em] translate-y-[2px] animate-mpk-blink bg-mpk-ink" />
    </Fragment>,
  ];
  return (
    <div className="w-full min-w-0 border border-mpk-line bg-mpk-bg-soft">
      <div className="flex h-9 items-center justify-between border-b border-mpk-line px-4 font-mpk-mono text-[11px] text-mpk-dim2">
        <span>~/my-app</span>
        <span>zsh</span>
      </div>
      <div className="overflow-x-auto p-4 font-mpk-mono text-[12.5px] leading-[1.9] text-mpk-dim sm:p-5 sm:text-[13px]">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoCard({
  title,
  href,
  index,
  children,
  className = "",
}: {
  title: string;
  href: string;
  index: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col border border-mpk-line bg-mpk-bg ${className}`}>
      <div className="flex h-11 items-center justify-between border-b border-mpk-line px-4">
        <span className="font-mpk-mono text-xs text-mpk-dim">
          <span className="text-mpk-dim2">{index}</span> <span className="text-mpk-ink">{title}</span>
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 font-mpk-mono text-[11px] text-mpk-dim transition-colors hover:text-mpk-blue"
        >
          docs <ArrowRightIcon width={12} height={12} />
        </Link>
      </div>
      <div className="mpk-grid-bg flex flex-1 items-center justify-center p-5">{children}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-mpk-line">
          <div aria-hidden="true" className="mpk-grid-bg absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="relative mx-auto grid max-w-[90rem] gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-28 lg:pb-28">
            <div className="min-w-0">
              <Link
                href="/docs/changelog/"
                className="inline-flex items-center gap-2 border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim transition-colors hover:border-mpk-amber hover:text-mpk-ink"
              >
                <span className="size-1.5 bg-mpk-amber" aria-hidden="true" />
                v{siteConfig.version} · first release
              </Link>
              <h1 className="mt-6 text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.03em] text-mpk-ink sm:text-6xl lg:text-[4.25rem]">
                Terminal-style components you <span className="text-mpk-amber">copy</span>, paste and own.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-mpk-dim sm:text-lg sm:leading-8">
                24 components for React and Tailwind 4: boot screens, terminal windows, a command palette, tmux bars and quiet effects. Square corners, hairline
                borders, amber and blue. Copied into your project with one command.
              </p>

              <div className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-11 min-w-0 flex-1 items-center gap-3 border border-mpk-line bg-mpk-bg-soft pr-1.5 pl-4 font-mpk-mono text-[13px]">
                  <span aria-hidden="true" className="text-mpk-amber">
                    $
                  </span>
                  <code className="min-w-0 flex-1 truncate text-mpk-ink">{INSTALL}</code>
                  <CopyButton value={INSTALL} label="Copy install command" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/docs/"
                  className="inline-flex h-10 items-center gap-2 bg-mpk-ink px-4 text-sm font-medium text-mpk-bg transition-opacity hover:opacity-90"
                >
                  Get started <ArrowRightIcon width={14} height={14} />
                </Link>
                <Link
                  href="/components/"
                  className="inline-flex h-10 items-center gap-2 border border-mpk-line px-4 text-sm font-medium text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue"
                >
                  Browse all components
                </Link>
              </div>
            </div>

            <TerminalWindow />
          </div>
        </section>

        {/* Live demos */}
        <section className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn list</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-mpk-ink sm:text-4xl">Three components, live.</h2>
            </div>
            <div className="flex max-w-md flex-col items-start gap-3 sm:items-end sm:text-right">
              <p className="text-sm leading-6 text-mpk-dim">
                Everything below is the real component running on this page. Click the boot screen to skip it, or
                replay it.
              </p>
              <Link
                href="/components/"
                className="inline-flex items-center gap-1.5 font-mpk-mono text-xs text-mpk-blue underline-offset-4 hover:underline"
              >
                Browse all components <ArrowRightIcon width={12} height={12} />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DemoCard index="01" title="boot-screen" href="/docs/components/boot-screen/" className="lg:col-span-2 lg:row-span-2">
              <div className="w-full">
                <BootScreenDemo height={440} />
              </div>
            </DemoCard>
            <DemoCard index="02" title="theme-toggle" href="/docs/components/theme-toggle/">
              <div className="py-6">
                <ThemeToggleDemo />
              </div>
            </DemoCard>
            <DemoCard index="03" title="reveal" href="/docs/components/reveal/">
              <div className="w-full">
                <RevealDemo compact stagger={0.1} />
              </div>
            </DemoCard>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-mpk-line">
          <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn --help</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-mpk-ink sm:text-4xl">
              Small on purpose. Built to be read, changed and kept.
            </h2>
            <div className="mt-12 grid border-t border-l border-mpk-line sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.flag} className="border-r border-b border-mpk-line p-6 sm:p-8">
                  <p className="font-mpk-mono text-xs text-mpk-blue">{f.flag}</p>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-mpk-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mpk-dim">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-start justify-between gap-6 border border-mpk-line bg-mpk-bg-soft p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="text-xl font-semibold tracking-tight text-mpk-ink">Ready when you are.</p>
                <p className="mt-1 text-sm text-mpk-dim">Set up the theme once, then add components as you need them.</p>
              </div>
              <Link
                href="/docs/installation/"
                className="inline-flex h-10 shrink-0 items-center gap-2 bg-mpk-amber px-4 text-sm font-medium text-mpk-bg transition-opacity hover:opacity-90"
              >
                Read the installation guide <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
