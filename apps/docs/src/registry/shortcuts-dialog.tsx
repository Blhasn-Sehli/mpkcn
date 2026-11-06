"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type Shortcut = {
  /** Keys to press. An array shows one badge per key, e.g. ["Ctrl", "K"]. */
  keys: string | string[];
  /** What the shortcut does. */
  description: ReactNode;
  /** Group heading it is listed under. Groups keep the order they first appear in. */
  group?: string;
};

export type ShortcutsDialogProps = {
  /** The shortcuts to list. @default "?" and "Esc" */
  shortcuts?: Shortcut[];
  /** Command shown in the header, after the prompt. Also the dialog's accessible name. @default "man shortcuts" */
  title?: string;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the dialog wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Key that toggles the dialog (ignored while typing in a field); false turns it off. @default "?" */
  hotkey?: string | false;
  /** Text under the list; false hides it. @default "press esc to close" */
  footer?: ReactNode | false;
  /** Extra classes for the panel. */
  className?: string;
};

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { keys: "?", description: "show this help" },
  { keys: "Esc", description: "close" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
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
 * A keyboard-shortcut cheat sheet in a terminal-style dialog. Press "?" anywhere
 * (outside text fields) to toggle it. Focus moves into the dialog, stays there,
 * and returns where it was when Esc, the close button or the backdrop closes it.
 */
export function ShortcutsDialog({
  shortcuts = DEFAULT_SHORTCUTS,
  title = "man shortcuts",
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "?",
  footer = "press esc to close",
  className,
}: ShortcutsDialogProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const mounted = useMounted();

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

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== hotkey || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      setOpen(!openRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, setOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-mpk-bg/70 px-4 pt-[16vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Panel shortcuts={shortcuts} title={title} footer={footer} onClose={() => setOpen(false)} className={className} />
    </div>,
    document.body,
  );
}

type PanelProps = {
  shortcuts: Shortcut[];
  title: string;
  footer: ReactNode | false;
  onClose: () => void;
  className?: string;
};

function Panel({ shortcuts, title, footer, onClose, className }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Focus the close button, lock page scroll, give focus back on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    // Trap Tab inside the dialog.
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
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

  const groups: { name: string | undefined; items: Shortcut[] }[] = [];
  for (const s of shortcuts) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className={cx(
        "flex max-h-[70vh] w-full max-w-[520px] flex-col overflow-hidden border border-mpk-line bg-mpk-bg-soft font-mpk-mono text-[13px] text-mpk-ink",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-mpk-line px-4 py-3">
        <span aria-hidden="true" className="text-mpk-amber">
          $
        </span>
        <h2 id={titleId} className="min-w-0 flex-1 truncate text-[13px] font-normal">
          {title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="border border-mpk-line px-1.5 py-px text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-amber"
        >
          esc
        </button>
      </div>

      <div className="overflow-y-auto px-4 py-3">
        {groups.map((group, gi) => (
          <section key={group.name ?? `__${gi}`} className="mb-3 last:mb-0">
            {group.name && <h3 className="mb-1.5 text-[11px] font-normal text-mpk-dim2"># {group.name}</h3>}
            <dl className="grid gap-2">
              {group.items.map((s, i) => {
                const keys = Array.isArray(s.keys) ? s.keys : [s.keys];
                return (
                  <div key={`${keys.join("+")}-${i}`} className="flex items-center gap-4">
                    <dt className="flex min-w-[96px] flex-wrap items-center gap-1">
                      {keys.map((k, ki) => (
                        <kbd
                          key={`${k}-${ki}`}
                          className="border border-mpk-line bg-mpk-bg px-1.5 py-px font-mpk-mono text-[11px] text-mpk-ink"
                        >
                          {k}
                        </kbd>
                      ))}
                    </dt>
                    <dd className="m-0 text-mpk-dim">{s.description}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>

      {footer !== false && (
        <div className="border-t border-mpk-line px-4 py-1.5 text-[11px] text-mpk-dim2">{footer}</div>
      )}
    </div>
  );
}
