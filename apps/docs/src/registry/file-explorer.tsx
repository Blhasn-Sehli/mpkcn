"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

export type FileNode = {
  /** Unique among its siblings. @default name */
  id?: string;
  /** Shown in the row. Folders get a trailing "/". */
  name: string;
  /** Dim text on the right of the row, e.g. a year or a size. */
  meta?: ReactNode;
  /** Makes it a folder. Its children show in the next column. */
  children?: FileNode[];
  /** Extra words the filter matches. */
  keywords?: string[];
  /** Default preview: a line or two under the title. */
  description?: ReactNode;
  /** Default preview: picture at the top (wipes in under a scan line). */
  image?: { src: string; alt?: string };
  /** Default preview: label / value rows. */
  details?: { label: string; value: ReactNode }[];
  /** Default preview: an "open" link. */
  href?: string;
  /** Replaces the default preview for this file. */
  preview?: ReactNode;
};

export type FileExplorerProps = {
  /** Top-level files and folders. */
  items: FileNode[];
  /** Root shown at the start of the path bar. @default "~" */
  root?: string;
  /** Ids (or names) of the selection to start on, from the top level down. @default the first item at each level */
  defaultPath?: string[];
  /** Most columns shown side by side on wide screens; older ones scroll out on the left. @default 3 */
  maxColumns?: number;
  /** Height of the browser, in px or any CSS length. @default 420 */
  height?: number | string;
  /** Called when the selected file changes (not on first render). */
  onSelect?: (node: FileNode, path: FileNode[]) => void;
  /** Called on Enter or double click on a file. Adds an "open" button to the default preview. */
  onOpen?: (node: FileNode, path: FileNode[]) => void;
  /** Your own preview for every file. @default node.preview, then the built-in one */
  renderPreview?: (node: FileNode, path: FileNode[]) => ReactNode;
  /** Let "/" open a filter box. @default true */
  filter?: boolean;
  /** Accessible name of the whole browser. @default "File explorer" */
  label?: string;
  /** Extra classes for the outer box. */
  className?: string;
};

const FOCUS_RING = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const keyOf = (n: FileNode) => n.id ?? n.name;
const isFolder = (n: FileNode) => Array.isArray(n.children);

function matches(n: FileNode, q: string): boolean {
  const hay = [n.name, ...(n.keywords ?? []), typeof n.description === "string" ? n.description : ""].join(" ").toLowerCase();
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

// Keeps a node when it matches (with everything under it) or when something under it matches.
function filterTree(nodes: FileNode[], q: string): FileNode[] {
  if (!q) return nodes;
  const out: FileNode[] = [];
  for (const n of nodes) {
    if (matches(n, q)) out.push(n);
    else if (n.children) {
      const kids = filterTree(n.children, q);
      if (kids.length) out.push({ ...n, children: kids });
    }
  }
  return out;
}

function leaves(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((n) => (n.children ? leaves(n.children) : [n]));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A ranger-style file browser: Miller columns of folders and files, a preview
 * pane for the selected file, a path bar and a "/" filter. Fully keyboard
 * driven (↑ ↓ Home End to move, → Enter to go in or open, ← Esc to go back).
 * Below 672px of its own width it shows one column at a time above the preview.
 */
export function FileExplorer({
  items,
  root = "~",
  defaultPath = [],
  maxColumns = 3,
  height = 420,
  onSelect,
  onOpen,
  renderPreview,
  filter = true,
  label = "File explorer",
  className,
}: FileExplorerProps) {
  const [sel, setSel] = useState<string[]>(defaultPath);
  const [col, setCol] = useState(() => Math.max(0, defaultPath.length - 1));
  const [query, setQuery] = useState("");
  const [finding, setFinding] = useState(false);
  const [focusReq, setFocusReq] = useState<{ target: number | "preview"; tick: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const findRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const q = query.trim().toLowerCase();
  const tree = useMemo(() => filterTree(items, q), [items, q]);

  // Walk the selection down the tree: one column per level, until a file (or an empty folder).
  const { columns, path } = useMemo(() => {
    const cols: FileNode[][] = [];
    const nodes: FileNode[] = [];
    let level = tree;
    for (let d = 0; level.length > 0; d++) {
      cols.push(level);
      const at = Math.max(0, level.findIndex((n) => keyOf(n) === sel[d]));
      const node = level[at];
      nodes.push(node);
      if (!node.children) break;
      level = node.children;
    }
    return { columns: cols, path: nodes };
  }, [tree, sel]);
  const activeCol = Math.min(col, Math.max(0, columns.length - 1));
  const active = activeCol;
  const current = path[path.length - 1];
  const all = useMemo(() => leaves(tree), [tree]);
  const position = current && !isFolder(current) ? `${all.indexOf(current) + 1}/${all.length}` : `0/${all.length}`;
  const start = Math.max(0, Math.min(active, columns.length - maxColumns));

  // Report selection changes (not the first render).
  const currentKey = path.map(keyOf).join("/");
  const lastKey = useRef(currentKey);
  useEffect(() => {
    if (lastKey.current === currentKey) return;
    lastKey.current = currentKey;
    if (path.length) onSelect?.(path[path.length - 1], path);
  }, [currentKey, onSelect, path]);

  // Move focus after the render that follows a keyboard action.
  useEffect(() => {
    if (!focusReq) return;
    const r = rootRef.current;
    if (focusReq.target === "preview") r?.querySelector<HTMLElement>("[data-preview]")?.focus();
    else r?.querySelector<HTMLElement>(`[data-col="${focusReq.target}"] [aria-selected="true"]`)?.focus();
  }, [focusReq]);

  useEffect(() => {
    if (finding) findRef.current?.focus();
  }, [finding]);

  if (items.length === 0) return null;

  const focus = (target: number | "preview") => setFocusReq((f) => ({ target, tick: (f?.tick ?? 0) + 1 }));

  const select = (c: number, node: FileNode) => {
    setSel([...path.slice(0, c).map(keyOf), keyOf(node)]);
    setCol(c);
  };

  const open = (node: FileNode) => {
    if (!isFolder(node)) onOpen?.(node, path);
  };

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT") return;
    const inPreview = Boolean(t.closest("[data-preview]"));
    const inList = Boolean(t.closest("[data-col]"));
    if (!inPreview && !inList) return;
    const k = e.key;
    // The column that has focus (it can differ from `active` for one render after a click).
    const active = inList ? Number(t.closest("[data-col]")?.getAttribute("data-col")) : activeCol;
    const list = columns[active] ?? [];
    const at = Math.max(0, list.indexOf(path[active]));

    if (k === "/" && filter) {
      setFinding(true);
    } else if (inList && (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End")) {
      const next = k === "Home" ? 0 : k === "End" ? list.length - 1 : Math.min(list.length - 1, Math.max(0, at + (k === "ArrowDown" ? 1 : -1)));
      select(active, list[next]);
      focus(active);
    } else if (inList && (k === "ArrowRight" || k === "Enter")) {
      if (active < columns.length - 1) {
        setCol(active + 1);
        focus(active + 1);
      } else if (k === "Enter" && onOpen) open(current);
      else focus("preview");
    } else if (k === "ArrowLeft" || k === "Escape") {
      if (inPreview) focus(active);
      else if (active > 0) {
        setCol(active - 1);
        focus(active - 1);
      } else return;
    } else return;
    // Handled here: keep page-level shortcuts (a "/" search, an Esc handler) from firing too.
    e.preventDefault();
    e.stopPropagation();
  }

  function onFindKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setQuery("");
      setFinding(false);
      focus(active);
    } else if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      setCol(columns.length - 1);
      focus(columns.length - 1);
    }
  }

  // A click on empty column space puts focus inside, so the arrow keys work right away.
  function onColumnClick(e: MouseEvent<HTMLDivElement>, c: number) {
    if (e.target !== e.currentTarget) return;
    setCol(c);
    focus(c);
  }

  const preview = !current ? null : isFolder(current) ? (
    <p className="m-0 font-mpk-mono text-[12px] text-mpk-dim2">empty folder</p>
  ) : (
    (renderPreview?.(current, path) ?? current.preview ?? <DefaultPreview key={currentKey} node={current} onOpen={onOpen ? () => open(current) : undefined} />)
  );

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx("@container w-full border border-mpk-line bg-mpk-bg font-mpk-mono text-mpk-ink", className)}
    >
      <div className="flex items-center gap-2 border-b border-mpk-line px-4 py-2.5 text-[12px] text-mpk-dim">
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              setCol(active - 1);
              focus(active - 1);
            }}
            aria-label="Up one folder"
            className={cx("shrink-0 border border-mpk-line bg-transparent px-1.5 text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue @2xl:hidden", FOCUS_RING)}
          >
            ‹ ..
          </button>
        )}
        <span className="min-w-0 truncate">
          <span className="text-mpk-amber">{root}</span>
          {path.map((n) => `/${n.name}`).join("")}
        </span>
      </div>

      {finding && (
        <div className="flex items-center gap-2.5 border-b border-mpk-line px-4 py-2 text-[13px] text-mpk-dim focus-within:outline focus-within:outline-1 focus-within:-outline-offset-2 focus-within:outline-mpk-amber">
          <span aria-hidden="true" className="text-mpk-amber">
            /
          </span>
          <input
            ref={findRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onFindKey}
            placeholder="filter by name"
            aria-label="Filter files by name"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-mpk-ink caret-mpk-blue outline-none placeholder:text-mpk-dim2"
          />
          <span role="status" className="shrink-0 text-[12px]">
            {all.length} match{all.length === 1 ? "" : "es"}
          </span>
        </div>
      )}

      <div className="flex flex-col @2xl:flex-row" style={{ height }}>
        {columns.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-mpk-dim">no match for &quot;{query}&quot;</div>
        ) : (
          <>
            {columns.map((nodes, c) => {
              const owner = c === 0 ? root : path[c - 1].name;
              return (
                <div
                  key={c}
                  data-col={c}
                  role="listbox"
                  aria-label={`${owner} contents`}
                  onClick={(e) => onColumnClick(e, c)}
                  className={cx(
                    "group/col min-h-0 shrink-0 overflow-y-auto border-mpk-line [scrollbar-color:var(--mpk-line)_transparent] [scrollbar-width:thin]",
                    "max-h-[45%] border-b @2xl:max-h-none @2xl:w-44 @2xl:border-r @2xl:border-b-0 @4xl:w-52",
                    c === active ? "block" : "hidden",
                    c >= start && c < start + maxColumns ? "@2xl:block" : "@2xl:hidden",
                  )}
                >
                  {nodes.map((n, i) => {
                    const selected = keyOf(n) === keyOf(path[c]);
                    const hot = selected && c === active;
                    return (
                      <div
                        key={keyOf(n)}
                        id={`${baseId}-${c}-${i}`}
                        role="option"
                        aria-selected={selected}
                        tabIndex={selected ? 0 : -1}
                        onFocus={() => setCol(c)}
                        onClick={() => select(c, n)}
                        onDoubleClick={() => open(n)}
                        className={cx(
                          "flex w-full cursor-pointer items-baseline justify-between gap-3 px-4 py-2 text-[13px] transition-colors outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4",
                          hot
                            ? "bg-mpk-blue text-mpk-bg focus-visible:outline-mpk-bg"
                            : selected
                              ? "bg-mpk-bg-soft text-mpk-ink focus-visible:outline-mpk-amber"
                              : "text-mpk-dim hover:text-mpk-ink focus-visible:outline-mpk-amber",
                        )}
                      >
                        <span className="min-w-0 truncate">
                          {n.name}
                          {isFolder(n) && "/"}
                          {hot && (
                            <span
                              aria-hidden="true"
                              className="ml-1.5 hidden h-[1em] w-[7px] translate-y-[2px] bg-current animate-mpk-blink group-focus-within/col:inline-block motion-reduce:animate-none"
                            />
                          )}
                        </span>
                        {n.meta !== undefined && <span className={cx("shrink-0 text-[12px]", hot ? "text-mpk-bg" : "text-mpk-dim2")}>{n.meta}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <section
              data-preview=""
              tabIndex={-1}
              aria-label={current ? `Preview of ${current.name}` : "Preview"}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto p-5 outline-none [scrollbar-color:var(--mpk-line)_transparent] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-mpk-amber @2xl:px-7 @2xl:py-6"
            >
              {preview}
            </section>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-mpk-line px-4 py-2.5 text-[12px] text-mpk-dim">
        <span className="text-mpk-ink">{position}</span>
        <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 [@media(pointer:coarse)]:hidden">
          {[
            ["↑↓", "move"],
            ["←→", "column"],
            ["enter", "open"],
            ...(filter ? [["/", "filter"]] : []),
            ["esc", "back"],
          ].map(([key, text]) => (
            <span key={key}>
              <kbd className="mr-1.5 border border-mpk-line px-1.5 py-px font-mpk-mono text-mpk-ink">{key}</kbd>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DefaultPreview({ node, onOpen }: { node: FileNode; onOpen?: () => void }) {
  const shotRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);

  // The one authored moment: the picture wipes in under a scan line.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const opts: KeyframeAnimationOptions = { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
    shotRef.current?.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], opts);
    scanRef.current?.animate([{ top: "0%", opacity: 1 }, { top: "100%", opacity: 0 }], { ...opts, fill: "forwards" });
  }, []);

  const empty = !node.image && !node.description && !node.details?.length && !node.href && !onOpen;

  return (
    <article>
      {node.image && !failed && (
        <div ref={shotRef} className="relative aspect-video max-h-[260px] w-full overflow-hidden border border-mpk-line bg-mpk-bg-soft">
          {/* A plain <img> keeps the component framework-agnostic; swap in next/image if you like. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.image.src}
            alt={node.image.alt ?? node.name}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-contain"
          />
          <span ref={scanRef} aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-mpk-blue opacity-0" />
        </div>
      )}
      <h3 className={cx("m-0 font-mpk-sans text-[1.4rem] leading-tight font-semibold tracking-tight text-mpk-ink", node.image && !failed && "mt-5")}>
        {node.name}
      </h3>
      {node.description && <p className="mt-1.5 mb-0 max-w-[52ch] font-mpk-sans text-[0.95rem] leading-relaxed text-mpk-dim">{node.description}</p>}
      {node.details && node.details.length > 0 && (
        <dl className="mt-4 mb-0 grid grid-cols-[minmax(64px,max-content)_1fr] gap-x-4 gap-y-1 text-[12.5px] leading-relaxed">
          {node.details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="text-mpk-blue">{d.label}</dt>
              <dd className="m-0 text-mpk-ink">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {(node.href || onOpen) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className={cx("border border-mpk-amber bg-mpk-amber px-3 py-1.5 text-[12px] text-mpk-bg transition-colors hover:bg-transparent hover:text-mpk-amber", FOCUS_RING)}
            >
              ⏎ open
            </button>
          )}
          {node.href && (
            <a
              href={node.href}
              target={/^https?:\/\//i.test(node.href) ? "_blank" : undefined}
              rel={/^https?:\/\//i.test(node.href) ? "noopener noreferrer" : undefined}
              className={cx("border border-mpk-line px-3 py-1.5 text-[12px] text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue", FOCUS_RING)}
            >
              open link ↗
            </a>
          )}
        </div>
      )}
      {empty && <p className="mt-2 mb-0 text-[12px] text-mpk-dim2">no preview</p>}
    </article>
  );
}
