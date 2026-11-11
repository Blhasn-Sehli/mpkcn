import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";
import { BootScreenDemo } from "@/components/demos/boot-screen-demo";
import { RevealDemo } from "@/components/demos/reveal-demo";
import { ThemeToggleDemo } from "@/components/demos/theme-toggle-demo";
import { ArrowRightIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { AutoVideo } from "@/components/video-showcase";
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
  // Real output of `mpkcn add theme-toggle` (CLI 0.3.0) in a fresh create-next-app project, npm log trimmed.
  const file = (k: number, word: string, dir: string, name: string, note?: string) => (
    <Fragment key={k}>
      <span className="text-mpk-blue">{`  ${word.padEnd(11)} `}</span>
      {dir}
      <span className="text-mpk-ink">{name}</span>
      {note && <span className="text-mpk-dim2">{`  ${note}`}</span>}
    </Fragment>
  );
  const lines: ReactNode[] = [
    <Fragment key={0}>
      <span className="text-mpk-amber">$</span> <span className="text-mpk-ink">npx mpkcn add theme-toggle</span>
    </Fragment>,
    <span key={1} className="text-mpk-dim">Adding theme-toggle (+ theme, theme-provider)</span>,
    file(2, "created", "src/components/mpkcn/", "mpkcn-theme.css"),
    file(3, "created", "src/components/mpkcn/", "theme-provider.tsx"),
    file(4, "created", "src/components/mpkcn/", "theme-toggle.tsx"),
    file(5, "updated", "src/app/", "globals.css", '(+ @import "../components/mpkcn/mpkcn-theme.css";)'),
    file(6, "updated", "src/app/", "layout.tsx", "(+ fonts, theme provider)"),
    <span key={7} className="text-mpk-dim2">&nbsp;</span>,
    <span key={8} className="text-mpk-dim">Installing dependencies</span>,
    <span key={9}>{"  "}npm install next-themes</span>,
    <span key={10} className="text-mpk-dim2">&nbsp;</span>,
    <span key={11} className="text-mpk-dim">Done. Use it:</span>,
    <Fragment key={12}>
      <span className="text-mpk-ink">{"  "}import</span> {"{ ThemeToggle }"} <span className="text-mpk-ink">from</span>{" "}
      <span className="text-mpk-amber">&quot;@/components/mpkcn/theme-toggle&quot;</span>;
    </Fragment>,
    <Fragment key={13}>
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
                v{siteConfig.version} · no manual setup
              </Link>
              <h1 className="mt-6 text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.03em] text-mpk-ink sm:text-6xl lg:text-[4.25rem]">
                Terminal-style components you <span className="text-mpk-amber">copy</span>, paste and own.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-mpk-dim sm:text-lg sm:leading-8">
                35 components for React and Tailwind 4: boot screens, terminal windows, a command palette, file explorers, tmux bars and quiet effects. Square corners, hairline
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

        {/* Video */}
        <section className="mx-auto max-w-[90rem] px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn --demo</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-mpk-ink sm:text-4xl">See it in action.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-mpk-dim sm:text-right">
              48 seconds: one command sets everything up, then the components, then adding them from your AI assistant.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <AutoVideo name="walkthrough" title="~/mpkcn/walkthrough.mp4" voiced label="mpkcn walkthrough with narration and captions" />
          </div>
        </section>

        {/* Live demos */}
        <section className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn list</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-mpk-ink sm:text-4xl">A few of the 35, live.</h2>
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

        {/* Overview video */}
        <section className="border-t border-mpk-line">
          <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
            <div>
              <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn --overview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-mpk-ink sm:text-4xl">
                35 components in <span className="text-mpk-amber">37 seconds.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-mpk-dim">
                Why every portfolio looks the same, what mpkcn does about it, and how one command (or your AI assistant)
                puts it in your project.
              </p>
            </div>
            <AutoVideo name="overview" title="~/mpkcn/overview.mp4" label="mpkcn overview, silent motion graphics" />
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
