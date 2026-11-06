"use client";

import { useState } from "react";
import { ShortcutsDialog, type Shortcut } from "@/registry/shortcuts-dialog";

const SHORTCUTS: Shortcut[] = [
  { keys: ["j", "k"], description: "next / previous section", group: "navigate" },
  { keys: "g", description: "back to top", group: "navigate" },
  { keys: ["1", "–", "5"], description: "jump to a section", group: "navigate" },
  { keys: ["Ctrl", "K"], description: "command palette", group: "general" },
  { keys: "?", description: "this help", group: "general" },
  { keys: "Esc", description: "close", group: "general" },
];

/** A button that opens ShortcutsDialog; "?" also opens it unless compact. */
export function ShortcutsDialogDemo({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 font-mpk-mono text-xs text-mpk-dim">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-mpk-line bg-mpk-bg-soft px-3 py-2 text-mpk-ink transition-colors hover:border-mpk-blue hover:text-mpk-blue"
      >
        <kbd className="border border-mpk-line bg-mpk-bg px-1.5 py-px text-[11px]">?</kbd>
        keyboard shortcuts
      </button>
      {!compact && (
        <p className="text-[11px] text-mpk-dim2">
          or press <kbd className="border border-mpk-line px-1 text-mpk-dim">?</kbd> anywhere on this page
        </p>
      )}
      <ShortcutsDialog shortcuts={SHORTCUTS} open={open} onOpenChange={setOpen} hotkey={compact ? false : "?"} />
    </div>
  );
}
