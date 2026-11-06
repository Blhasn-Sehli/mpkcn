"use client";

import { useState } from "react";
import { TmuxBar, type TmuxBarProps } from "@/registry/tmux-bar";

const PANES: Record<string, string[]> = {
  zsh: ["$ pnpm dev", "  ▲ ready on http://localhost:3000", "  ✓ compiled in 412ms"],
  vim: ["~ src/app/page.tsx", "  1 export default function Page() {", '  2   return <TmuxBar session="dev" />;', "  3 }"],
  logs: ["GET / 200 in 18ms", "GET /docs 200 in 9ms", "GET /r/index.json 200 in 2ms"],
};

/** A fake terminal pane with a TmuxBar docked to its bottom; click the windows to switch. */
export function TmuxBarDemo({ compact = false, ...props }: Partial<TmuxBarProps> & { compact?: boolean }) {
  const names = Object.keys(PANES);
  const [active, setActive] = useState(0);

  return (
    <div className="flex w-full flex-col overflow-hidden border border-mpk-line bg-mpk-bg">
      <pre className={`m-0 overflow-hidden p-4 font-mpk-mono text-[12px] leading-relaxed text-mpk-dim ${compact ? "h-24" : "h-44"}`}>
        {PANES[names[active]].join("\n")}
      </pre>
      <TmuxBar
        session="dev"
        windows={names.map((label, i) => ({ label, onSelect: () => setActive(i) }))}
        activeWindow={active}
        segments={compact ? [] : [{ label: "main", tone: "amber" }, { label: "online", live: true, collapse: true }]}
        host={compact ? undefined : "mpkcn"}
        uptime={!compact}
        {...props}
      />
    </div>
  );
}
