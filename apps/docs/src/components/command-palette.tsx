"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { SearchEntry } from "@/lib/toc";
import { FileIcon, HashIcon, SearchIcon } from "./icons";

const noopSubscribe = () => () => {};

type Group = { label: string; items: SearchEntry[] };

function matches(entry: SearchEntry, terms: string[]) {
  const hay = `${entry.title} ${entry.page ?? ""} ${entry.section}`.toLowerCase().replace(/[-_.]/g, " ");
  return terms.every((t) => hay.includes(t));
}

function rank(entry: SearchEntry, q: string) {
  const t = entry.title.toLowerCase();
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(q)) return 2;
  return 3;
}

function search(entries: SearchEntry[], query: string): Group[] {
  const q = query.trim().toLowerCase();
  const pages = entries.filter((e) => e.section !== "Headings");
  if (!q) {
    const order = ["Pages", "Getting started", "Components"];
    return order
      .map((label) => ({ label, items: pages.filter((p) => p.section === label) }))
      .filter((g) => g.items.length > 0);
  }
  const terms = q.replace(/[-_.]/g, " ").split(/\s+/).filter(Boolean);
  const byRank = (a: SearchEntry, b: SearchEntry) => rank(a, q) - rank(b, q);
  const hitPages = pages.filter((e) => matches(e, terms)).sort(byRank);
  const hitHeadings = entries
    .filter((e) => e.section === "Headings" && matches(e, terms))
    .sort(byRank)
    .slice(0, 12);
  return [
    { label: "Pages", items: hitPages },
    { label: "Headings", items: hitHeadings },
  ].filter((g) => g.items.length > 0);
}

export function CommandPalette({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => true,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const listId = useId();
  const titleId = useId();

  const groups = useMemo(() => search(entries, query), [entries, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const show = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Give focus back to whatever opened the palette.
    requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);

  // Cmd+K / Ctrl+K toggles; "/" opens when not typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else show();
        return;
      }
      if (e.key === "/" && !open) {
        const el = e.target as HTMLElement | null;
        const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
        if (!typing) {
          e.preventDefault();
          show();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show, close]);

  // Focus the input and lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // Keep the active option visible.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  };

  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === "Tab") {
      // Focus trap: cycle between the focusable elements inside the dialog.
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("input, button, [href]");
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  let index = -1;

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search documentation"
        aria-keyshortcuts="Control+K Meta+K"
        className="group inline-flex h-8 items-center gap-2 border border-mpk-line bg-mpk-bg-soft/60 px-2 text-mpk-dim transition-colors hover:border-mpk-dim2 hover:text-mpk-ink sm:w-56 sm:px-2.5 lg:w-64"
      >
        <SearchIcon className="shrink-0" />
        <span className="hidden flex-1 text-left font-mpk-mono text-xs sm:inline">
          <span className="text-mpk-dim2">$</span> grep docs…
        </span>
        <kbd className="hidden h-5 items-center gap-0.5 border border-mpk-line px-1.5 font-mpk-mono text-[10px] text-mpk-dim sm:inline-flex">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-mpk-bg/75 backdrop-blur-[2px]"
              onClick={close}
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onKeyDown={onDialogKeyDown}
              className="relative flex max-h-[70vh] w-full max-w-xl flex-col border border-mpk-line bg-mpk-bg"
            >
              <h2 id={titleId} className="sr-only">
                Search documentation
              </h2>
              <div className="flex items-center gap-3 border-b border-mpk-line px-4">
                <span aria-hidden="true" className="font-mpk-mono text-sm text-mpk-amber">
                  $
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={flat.length ? `${listId}-${active}` : undefined}
                  aria-label="Search pages and headings"
                  placeholder="search pages and headings…"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  className="h-12 min-w-0 flex-1 bg-transparent font-mpk-mono text-sm text-mpk-ink outline-none placeholder:text-mpk-dim2 focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={close}
                  className="border border-mpk-line px-1.5 py-0.5 font-mpk-mono text-[10px] text-mpk-dim hover:text-mpk-ink"
                >
                  esc
                </button>
              </div>

              <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="overflow-y-auto overscroll-contain p-2">
                {flat.length === 0 ? (
                  <p className="px-3 py-10 text-center font-mpk-mono text-sm text-mpk-dim">
                    grep: no match for <span className="text-mpk-ink">&quot;{query}&quot;</span>
                  </p>
                ) : (
                  groups.map((group) => (
                    <div key={group.label} role="group" aria-label={group.label} className="mb-1 last:mb-0">
                      <div className="px-3 pt-2 pb-1 font-mpk-mono text-[11px] tracking-wide text-mpk-dim2 uppercase">
                        {group.label}
                      </div>
                      {group.items.map((item) => {
                        index++;
                        const i = index;
                        const selected = i === active;
                        const isHeading = item.section === "Headings";
                        return (
                          <div
                            key={item.href}
                            id={`${listId}-${i}`}
                            data-index={i}
                            role="option"
                            aria-selected={selected}
                            onMouseMove={() => setActive(i)}
                            onClick={() => go(item)}
                            className={`relative flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                              selected ? "bg-mpk-bg-soft text-mpk-ink" : "text-mpk-dim"
                            }`}
                          >
                            {selected && <span aria-hidden="true" className="absolute inset-y-1 left-0 w-px bg-mpk-amber" />}
                            {isHeading ? (
                              <HashIcon className="shrink-0 text-mpk-dim2" />
                            ) : (
                              <FileIcon className="shrink-0 text-mpk-dim2" />
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {item.title}
                              {item.page && <span className="ml-2 text-xs text-mpk-dim2">{item.page}</span>}
                            </span>
                            {selected && (
                              <span aria-hidden="true" className="font-mpk-mono text-[11px] text-mpk-amber">
                                ↵
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-4 border-t border-mpk-line px-4 py-2 font-mpk-mono text-[11px] text-mpk-dim2">
                <span>
                  <kbd className="text-mpk-dim">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="text-mpk-dim">↵</kbd> open
                </span>
                <span>
                  <kbd className="text-mpk-dim">esc</kbd> close
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
