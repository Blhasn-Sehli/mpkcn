"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type CommandItem = {
  /** Unique id. @default the label */
  id?: string;
  /** Text shown and searched, e.g. "theme dark". */
  label: string;
  /** Group heading it is listed under. Groups keep the order they first appear in. */
  group?: string;
  /** Small dim text on the right, e.g. "link" or "action". */
  hint?: ReactNode;
  /** Shortcut shown on the right as a key badge, e.g. "G H". */
  shortcut?: string;
  /** Extra words that should match this item. */
  keywords?: string[];
  /** Listed but not selectable. @default false */
  disabled?: boolean;
  /** Runs when the item is picked. */
  onSelect: () => void;
};

export type CommandPaletteProps = {
  /** Everything the palette can run. */
  items: CommandItem[];
  /** Controlled open state (dialog mode). */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the palette wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Key that toggles it together with Ctrl (or Cmd on macOS); false turns the shortcut off. In inline mode it focuses the input. @default "k" */
  hotkey?: string | false;
  /** Open as a centered dialog over the page. Set to false to render the panel inline, always visible. @default true */
  modal?: boolean;
  /** Placeholder of the search input. @default "type a command…" */
  placeholder?: string;
  /** Shown when nothing matches. @default "no match" */
  emptyText?: ReactNode;
  /** Prompt in front of the input. @default "$" */
  prompt?: string;
  /** Accessible name of the dialog and of the list. @default "Command palette" */
  label?: string;
  /** Key-hint footer; false hides it. @default "↑↓ select · ⏎ run · esc close" (no "esc close" inline) */
  footer?: ReactNode | false;
  /** Close the dialog after an item runs. @default true */
  closeOnSelect?: boolean;
  /** Custom matcher. @default every word of the query appears in the label, group or keywords */
  filter?: (item: CommandItem, query: string) => boolean;
  /** Extra classes for the panel. */
  className?: string;
};

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function defaultFilter(item: CommandItem, query: string): boolean {
  const hay = [item.label, item.group ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * A terminal-style command palette. Ctrl/Cmd+K opens it as a dialog (or pass
 * `modal={false}` to render it inline); type to filter, ↑ ↓ to move, Enter to run,
 * Esc to close. Built as an ARIA combobox with a listbox; focus is trapped in the
 * dialog and goes back where it was when it closes.
 */
export function CommandPalette({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "k",
  modal = true,
  placeholder = "type a command…",
  emptyText = "no match",
  prompt = "$",
  label = "Command palette",
  footer,
  closeOnSelect = true,
  filter = defaultFilter,
  className,
}: CommandPaletteProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const mounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const openRef = useRef(isOpen);
  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  // Global Ctrl/Cmd + hotkey.
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== hotkey.toLowerCase()) return;
      e.preventDefault();
      if (modal) setOpen(!openRef.current);
      else inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, modal, setOpen]);

  const footerText = footer ?? (modal ? "↑↓ select · ⏎ run · esc close" : "↑↓ select · ⏎ run");

  if (!modal) {
    return (
      <Panel
        inputRef={inputRef}
        items={items}
        placeholder={placeholder}
        emptyText={emptyText}
        prompt={prompt}
        label={label}
        footer={footerText}
        filter={filter}
        onRun={(item) => item.onSelect()}
        className={className}
      />
    );
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-mpk-bg/70 px-4 pt-[16vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Panel
        dialog
        inputRef={inputRef}
        items={items}
        placeholder={placeholder}
        emptyText={emptyText}
        prompt={prompt}
        label={label}
        footer={footerText}
        filter={filter}
        onClose={() => setOpen(false)}
        onRun={(item) => {
          if (closeOnSelect) {
            setOpen(false);
            // Run after the dialog has closed and handed focus back, so the
            // command can move focus or scroll without being undone.
            window.setTimeout(item.onSelect, 0);
          } else item.onSelect();
        }}
        className={className}
      />
    </div>,
    document.body,
  );
}

type PanelProps = {
  dialog?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  items: CommandItem[];
  placeholder: string;
  emptyText: ReactNode;
  prompt: string;
  label: string;
  footer: ReactNode | false;
  filter: (item: CommandItem, query: string) => boolean;
  onRun: (item: CommandItem) => void;
  onClose?: () => void;
  className?: string;
};

// Mounted fresh each time the dialog opens, so the query and selection reset.
function Panel({
  dialog,
  inputRef,
  items,
  placeholder,
  emptyText,
  prompt,
  label,
  footer,
  filter,
  onRun,
  onClose,
  className,
}: PanelProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  // Filter, then order by group (groups keep the order they first appear in).
  const matched = query.trim() ? items.filter((item) => filter(item, query.trim())) : items;
  const groups: { name: string | undefined; items: CommandItem[] }[] = [];
  for (const item of matched) {
    let g = groups.find((x) => x.name === item.group);
    if (!g) groups.push((g = { name: item.group, items: [] }));
    g.items.push(item);
  }
  const flat = groups.flatMap((g) => g.items);
  const enabled = flat.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  const activeIndex = enabled.includes(active) ? active : (enabled[0] ?? -1);

  // Dialog: focus the input, lock page scroll, give focus back on close.
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [dialog, inputRef]);

  // Keep the active option in view.
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // optionId only depends on baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  function move(delta: number) {
    if (enabled.length === 0) return;
    const at = enabled.indexOf(activeIndex);
    setActive(enabled[(at + delta + enabled.length) % enabled.length]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home" && enabled.length) {
      e.preventDefault();
      setActive(enabled[0]);
    } else if (e.key === "End" && enabled.length) {
      e.preventDefault();
      setActive(enabled[enabled.length - 1]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item && !item.disabled) onRun(item);
    } else if (e.key === "Escape" && dialog) {
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
    } else if (e.key === "Tab" && dialog) {
      // The input is the only stop in the dialog: keep focus inside.
      e.preventDefault();
    }
  }

  // Index in `flat` of each group's first item.
  const offsets = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0));

  return (
    <div
      role={dialog ? "dialog" : undefined}
      aria-modal={dialog || undefined}
      aria-label={dialog ? label : undefined}
      className={cx(
        "w-full max-w-[520px] overflow-hidden border border-mpk-line bg-mpk-bg-soft font-mpk-mono text-[13px] text-mpk-ink",
        !dialog && "transition-colors focus-within:border-mpk-blue",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-mpk-line px-4 py-3">
        <span aria-hidden="true" className="text-mpk-amber">
          {prompt}
        </span>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-label={dialog ? "Search commands" : `${label}: search commands`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="min-w-0 flex-1 bg-transparent text-mpk-ink caret-mpk-blue outline-none placeholder:text-mpk-dim2"
        />
      </div>

      <div id={listId} role="listbox" aria-label={label} className="max-h-[300px] overflow-y-auto p-1.5">
        {flat.length === 0 && (
          <div role="presentation" className="px-2.5 py-2 text-mpk-dim2">
            {emptyText}
          </div>
        )}
        {groups.map((group, gi) => {
          const headingId = `${baseId}-group-${gi}`;
          return (
            <div
              key={group.name ?? `__${gi}`}
              role={group.name ? "group" : "presentation"}
              aria-labelledby={group.name ? headingId : undefined}
              className="mb-1 last:mb-0"
            >
              {group.name && (
                <div id={headingId} className="px-2.5 pt-2 pb-1 text-[11px] text-mpk-dim2">
                  # {group.name}
                </div>
              )}
              {group.items.map((item, j) => {
                const i = offsets[gi] + j;
                const isActive = i === activeIndex;
                return (
                  <div
                    key={item.id ?? item.label}
                    id={optionId(i)}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={item.disabled || undefined}
                    onMouseMove={() => !item.disabled && i !== activeIndex && setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => !item.disabled && onRun(item)}
                    className={cx(
                      "flex cursor-pointer items-center gap-3 border-l-2 px-2.5 py-1.5",
                      isActive ? "border-mpk-blue bg-mpk-bg text-mpk-ink" : "border-transparent text-mpk-dim",
                      item.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span aria-hidden="true" className={isActive ? "text-mpk-blue" : "text-transparent"}>
                      ›
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint && <span className="text-[11px] text-mpk-dim2">{item.hint}</span>}
                    {item.shortcut && (
                      <kbd className="border border-mpk-line px-1.5 py-px font-mpk-mono text-[11px] text-mpk-dim">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {footer !== false && (
        <div aria-hidden="true" className="border-t border-mpk-line px-4 py-1.5 text-[11px] text-mpk-dim2">
          {footer}
        </div>
      )}
    </div>
  );
}
