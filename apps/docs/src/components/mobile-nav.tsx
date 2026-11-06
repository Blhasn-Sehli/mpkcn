"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DocsNav } from "./docs-nav";
import { CloseIcon, MenuIcon } from "./icons";
import { Logo } from "./logo";

/** Below lg, the docs sidebar lives in this drawer. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Close on route change.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const trigger = triggerRef.current;
    return () => {
      document.documentElement.style.overflow = prev;
      trigger?.focus();
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key !== "Tab") return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>("a, button");
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="-ml-1.5 inline-grid size-8 place-items-center text-mpk-dim hover:text-mpk-ink lg:hidden"
      >
        <MenuIcon width={18} height={18} />
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[80] lg:hidden" onKeyDown={onKeyDown}>
            <div aria-hidden="true" className="absolute inset-0 bg-mpk-bg/70 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-mpk-line bg-mpk-bg"
            >
              <div className="flex h-14 items-center justify-between border-b border-mpk-line px-5">
                <span id={titleId} className="sr-only">
                  Navigation
                </span>
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="inline-grid size-8 place-items-center text-mpk-dim hover:text-mpk-ink"
                >
                  <CloseIcon width={18} height={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="mb-7 flex flex-col">
                  <Link href="/" className="py-1.5 text-sm text-mpk-dim hover:text-mpk-ink">
                    Home
                  </Link>
                  <Link href="/docs/" className="py-1.5 text-sm text-mpk-dim hover:text-mpk-ink">
                    Docs
                  </Link>
                  <Link href="/components/" className="py-1.5 text-sm text-mpk-dim hover:text-mpk-ink">
                    Components
                  </Link>
                </div>
                <DocsNav onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
