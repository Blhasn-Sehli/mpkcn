"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentCategory } from "@/lib/component-categories";
import { CopyButton } from "./copy-button";
import { demos } from "./demos";
import { ArrowRightIcon, CheckIcon, CloseIcon, CopyIcon, SearchIcon } from "./icons";

export type GalleryFile = {
  /** Where the CLI writes it, e.g. "lib/matrix-rain.ts". */
  target: string;
  /** Raw source (LF line endings). */
  code: string;
  /** Shiki HTML, highlighted at build time. */
  html: string;
};

export type GalleryItem = {
  name: string;
  title: string;
  description: string;
  category: ComponentCategory;
  dependencies: string[];
  files: GalleryFile[];
};

type Props = {
  items: GalleryItem[];
  /** Chip order (only categories that have at least one item). */
  categories: ComponentCategory[];
};

const ALL = "All";

function matches(item: GalleryItem, terms: string[]) {
  const hay = `${item.name} ${item.title} ${item.description} ${item.category}`.toLowerCase().replace(/[-_.]/g, " ");
  return terms.every((t) => hay.includes(t));
}

export function ComponentsGallery({ items, categories }: Props) {
  const [category, setCategory] = useState<ComponentCategory | typeof ALL>(ALL);
  const [query, setQuery] = useState("");
  const [codeFor, setCodeFor] = useState<GalleryItem | null>(null);
  const searchId = useId();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, [items]);

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().replace(/[-_.]/g, " ").split(/\s+/).filter(Boolean);
    return items.filter((item) => (category === ALL || item.category === category) && matches(item, terms));
  }, [items, category, query]);

  const reset = () => {
    setCategory(ALL);
    setQuery("");
  };

  const chips: { label: ComponentCategory | typeof ALL; count: number }[] = [
    { label: ALL, count: items.length },
    ...categories.map((c) => ({ label: c, count: counts.get(c) ?? 0 })),
  ];

  return (
    <>
      <div className="flex flex-col gap-4 border-y border-mpk-line py-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = category === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(chip.label)}
                className={`inline-flex h-8 items-center gap-2 border px-3 font-mpk-mono text-xs transition-colors ${
                  active
                    ? "border-mpk-amber bg-mpk-bg-soft text-mpk-ink"
                    : "border-mpk-line text-mpk-dim hover:border-mpk-dim2 hover:text-mpk-ink"
                }`}
              >
                {chip.label}
                <span className={active ? "text-mpk-amber" : "text-mpk-dim2"}>{chip.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex h-9 w-full items-center gap-2 border border-mpk-line bg-mpk-bg-soft px-3 focus-within:border-mpk-blue lg:w-72">
          <SearchIcon width={14} height={14} className="shrink-0 text-mpk-dim2" aria-hidden="true" />
          <label htmlFor={searchId} className="sr-only">
            Search components
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep components…"
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent font-mpk-mono text-[13px] text-mpk-ink outline-none placeholder:text-mpk-dim2 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="inline-grid size-6 shrink-0 place-items-center text-mpk-dim hover:text-mpk-ink"
            >
              <CloseIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 mb-6 font-mpk-mono text-[11px] text-mpk-dim2">
        <span className="text-mpk-amber">{visible.length}</span> of {items.length} components
        {category !== ALL && (
          <>
            {" "}
            in <span className="text-mpk-dim">{category}</span>
          </>
        )}
        {query.trim() && (
          <>
            {" "}
            matching <span className="text-mpk-dim">&quot;{query.trim()}&quot;</span>
          </>
        )}
      </p>

      {visible.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.name} className="min-w-0">
              <GalleryCard item={item} onShowCode={() => setCodeFor(item)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 border border-dashed border-mpk-line p-8 font-mpk-mono text-[13px] text-mpk-dim">
          <p>
            <span className="text-mpk-amber">$</span> mpkcn list | grep &quot;{query.trim() || category}&quot;
          </p>
          <p className="text-mpk-dim2">no components match.</p>
          <button
            type="button"
            onClick={reset}
            className="border border-mpk-line px-2.5 py-1 text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue"
          >
            clear filters
          </button>
        </div>
      )}

      <CodeDialog item={codeFor} onClose={() => setCodeFor(null)} />
    </>
  );
}

function GalleryCard({ item, onShowCode }: { item: GalleryItem; onShowCode: () => void }) {
  const install = `npx mpkcn add ${item.name}`;
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col border border-mpk-line bg-mpk-bg transition-colors hover:border-mpk-dim2"
    >
      <DemoSlot name={item.name} title={item.title} />

      <div className="flex flex-1 flex-col gap-4 border-t border-mpk-line p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={titleId} className="truncate text-base font-semibold tracking-tight text-mpk-ink">
              {item.title}
            </h2>
            <span className="shrink-0 font-mpk-mono text-[10px] tracking-wider text-mpk-dim2 uppercase">
              {item.category}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-mpk-dim">{item.description}</p>
        </div>

        <div className="mt-auto flex h-9 min-w-0 items-center gap-2 border border-mpk-line bg-mpk-bg-soft pr-1 pl-3 font-mpk-mono text-xs">
          <span aria-hidden="true" className="text-mpk-amber">
            $
          </span>
          <code className="min-w-0 flex-1 truncate text-mpk-ink">{install}</code>
          <CopyButton value={install} label={`Copy install command for ${item.title}`} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onShowCode}
            aria-haspopup="dialog"
            aria-label={`View ${item.title} code`}
            className="inline-flex h-8 items-center gap-1.5 border border-mpk-line px-3 font-mpk-mono text-xs text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue"
          >
            <span aria-hidden="true" className="text-mpk-dim2">
              {"</>"}
            </span>
            code
          </button>
          <Link
            href={`/docs/components/${item.name}/`}
            aria-label={`${item.title} docs`}
            className="inline-flex h-8 items-center gap-1 font-mpk-mono text-xs text-mpk-dim transition-colors hover:text-mpk-blue"
          >
            docs <ArrowRightIcon width={12} height={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Live preview area. The demo mounts only once the card comes near the viewport
 * and unmounts again when it is far offscreen, so heavy demos (canvas, timers)
 * never all run at once.
 */
function DemoSlot({ name, title }: { name: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const Demo = demos[name];

  useEffect(() => {
    const el = ref.current;
    if (!el || !Demo) return;
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setMounted(true);
      },
      { rootMargin: "200px 0px" },
    );
    const far = new IntersectionObserver(
      (entries) => {
        if (entries.every((e) => !e.isIntersecting)) setMounted(false);
      },
      { rootMargin: "900px 0px" },
    );
    near.observe(el);
    far.observe(el);
    return () => {
      near.disconnect();
      far.disconnect();
    };
  }, [Demo]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={`${title} preview`}
      className="mpk-grid-bg relative flex h-72 items-center justify-center overflow-hidden p-3"
    >
      {!Demo ? (
        <DemoPlaceholder name={name} />
      ) : mounted ? (
        <div className="flex w-full justify-center">
          <Demo compact />
        </div>
      ) : (
        <p aria-hidden="true" className="font-mpk-mono text-[11px] text-mpk-dim2">
          <span className="text-mpk-amber">$</span> mount {name}
        </p>
      )}
    </div>
  );
}

function DemoPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-full max-w-[16rem] border border-mpk-line bg-mpk-bg font-mpk-mono text-[11px]">
      <div className="flex h-7 items-center gap-1.5 border-b border-mpk-line px-3">
        <span aria-hidden="true" className="size-1.5 bg-mpk-dim2" />
        <span aria-hidden="true" className="size-1.5 bg-mpk-dim2" />
        <span className="ml-auto text-mpk-dim2">{name}.tsx</span>
      </div>
      <div className="space-y-1.5 p-3 leading-5">
        <p className="text-mpk-dim">
          <span className="text-mpk-amber">$</span> mpkcn preview {name}
        </p>
        <p className="text-mpk-dim2">no live preview yet; see the docs.</p>
        <p className="text-mpk-dim">
          <span className="text-mpk-amber">$</span>{" "}
          <span aria-hidden="true" className="inline-block h-[1em] w-[0.5em] translate-y-[2px] bg-mpk-dim2" />
        </p>
      </div>
    </div>
  );
}

/** Full source of a component, file by file, in a modal <dialog>. */
function CodeDialog({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [fileIndex, setFileIndex] = useState(0);
  const [shownFor, setShownFor] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Start on the first file whenever a different component opens.
  if ((item?.name ?? null) !== shownFor) {
    setShownFor(item?.name ?? null);
    setFileIndex(0);
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !item) return;
    if (!dialog.open) dialog.showModal();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      if (dialog.open) dialog.close();
    };
  }, [item]);

  const files = item?.files ?? [];
  const file = files[Math.min(fileIndex, files.length - 1)];

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    let next = fileIndex;
    if (e.key === "ArrowRight") next = (fileIndex + 1) % files.length;
    else if (e.key === "ArrowLeft") next = (fileIndex - 1 + files.length) % files.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = files.length - 1;
    else return;
    e.preventDefault();
    setFileIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto h-[min(48rem,calc(100dvh-2rem))] w-[min(60rem,calc(100vw-2rem))] max-w-none border border-mpk-line bg-mpk-bg p-0 text-mpk-ink backdrop:bg-mpk-bg/75 backdrop:backdrop-blur-[2px] open:flex open:flex-col"
    >
      {item && file && (
        <>
          <div className="flex min-h-14 items-center gap-3 border-b border-mpk-line px-4 sm:px-5">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="truncate text-sm font-semibold text-mpk-ink">
                {item.title}
              </h2>
              <p className="truncate font-mpk-mono text-[11px] text-mpk-dim2">
                <span className="text-mpk-amber">$</span> npx mpkcn add {item.name}
              </p>
            </div>
            <CopyAllButton value={file.code} label={`Copy ${file.target}`} />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close code"
              className="inline-grid size-8 shrink-0 place-items-center text-mpk-dim hover:text-mpk-ink"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Files"
            onKeyDown={onTabKeyDown}
            className="flex shrink-0 items-center overflow-x-auto border-b border-mpk-line px-2"
          >
            {files.map((f, i) => {
              const selected = f === file;
              return (
                <button
                  key={f.target}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setFileIndex(i)}
                  className={`relative h-10 shrink-0 px-3 font-mpk-mono text-xs transition-colors ${
                    selected ? "text-mpk-ink" : "text-mpk-dim hover:text-mpk-ink"
                  }`}
                >
                  {selected && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-px bg-mpk-amber" />}
                  {f.target}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            aria-label={file.target}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-auto bg-mpk-bg-soft py-4 outline-none focus-visible:ring-1 focus-visible:ring-mpk-blue focus-visible:ring-inset [&_pre]:outline-none"
            // Shiki output is generated at build time from our own registry sources.
            dangerouslySetInnerHTML={{ __html: file.html }}
          />

          <div className="flex items-center justify-between gap-3 border-t border-mpk-line px-4 py-2.5 font-mpk-mono text-[11px] text-mpk-dim2 sm:px-5">
            <span className="truncate">
              {item.dependencies.length > 0 ? `deps: ${item.dependencies.join(", ")}` : "no npm deps"}
              {files.length > 1 && ` · ${files.length} files`}
            </span>
            <Link
              href={`/docs/components/${item.name}/`}
              className="inline-flex shrink-0 items-center gap-1 text-mpk-dim transition-colors hover:text-mpk-blue"
            >
              docs <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>
        </>
      )}
    </dialog>
  );
}

/** Text button that copies the whole file. */
function CopyAllButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); fail quietly.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 border border-mpk-line px-2.5 font-mpk-mono text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue"
    >
      {copied ? <CheckIcon width={13} height={13} className="text-mpk-amber" /> : <CopyIcon width={13} height={13} />}
      {copied ? "copied" : "copy all"}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
