"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { CommandPalette, type CommandItem } from "@/registry/command-palette";

/**
 * CommandPalette rendered inline, plus a button that opens the dialog version.
 * The global Ctrl+K shortcut is off here because this site's own search uses it.
 */
export function CommandPaletteDemo({ compact = false }: { compact?: boolean }) {
  const { setTheme } = useTheme();
  const [last, setLast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const say = (text: string) => () => setLast(text);
  const items: CommandItem[] = [
    { label: "cd ~/projects", group: "navigate", hint: "dir", onSelect: say("cd ~/projects") },
    { label: "cd ~/docs", group: "navigate", hint: "dir", shortcut: "G D", onSelect: say("cd ~/docs") },
    { label: "open github", group: "links", hint: "link", keywords: ["source", "repo"], onSelect: say("open github") },
    { label: "send email", group: "links", hint: "link", keywords: ["mail", "contact"], onSelect: say("send email") },
    {
      label: "theme dark",
      group: "actions",
      hint: "action",
      onSelect: () => {
        setTheme("dark");
        setLast("theme dark");
      },
    },
    {
      label: "theme light",
      group: "actions",
      hint: "action",
      onSelect: () => {
        setTheme("light");
        setLast("theme light");
      },
    },
    { label: "rm -rf /", group: "actions", hint: "nope", disabled: true, onSelect: say("rm -rf /") },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <CommandPalette items={compact ? items.slice(0, 5) : items} modal={false} hotkey={false} className={compact ? "[&_[role=listbox]]:max-h-[150px]" : "[&_[role=listbox]]:max-h-[190px]"} />
      <div className="flex w-full max-w-[520px] flex-wrap items-center justify-between gap-3 font-mpk-mono text-[11px] text-mpk-dim">
        <span aria-live="polite">
          {last ? (
            <>
              <span className="text-mpk-amber">&gt;</span> ran <span className="text-mpk-ink">{last}</span>
            </>
          ) : (
            "pick a command"
          )}
        </span>
        {!compact && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-mpk-line bg-mpk-bg px-2.5 py-1 text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue"
          >
            open as dialog
          </button>
        )}
      </div>
      {!compact && <CommandPalette items={items} open={open} onOpenChange={setOpen} hotkey={false} />}
    </div>
  );
}
