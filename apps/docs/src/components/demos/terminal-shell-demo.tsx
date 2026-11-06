"use client";

import { useTheme } from "next-themes";
import { TerminalShell, type TerminalShellProps } from "@/registry/terminal-shell";

/** TerminalShell with a few sample commands. */
export function TerminalShellDemo({ compact = false }: { compact?: boolean }) {
  const { setTheme } = useTheme();

  const commands: TerminalShellProps["commands"] = {
    whoami: { description: "print the current user", run: () => "guest" },
    date: { description: "print the date", run: () => new Date().toString() },
    echo: { description: "print the arguments", usage: "echo <text>", run: (args) => args.join(" ") },
    theme: {
      description: "switch the site theme",
      usage: "theme <dark|light>",
      run: ([mode]) => {
        if (mode !== "dark" && mode !== "light") return "usage: theme <dark|light>";
        setTheme(mode);
        return `theme set to ${mode}`;
      },
    },
    ping: {
      description: "an async command",
      usage: "ping <host>",
      run: async ([host = "mpkcn.dev"], ctx) => {
        ctx.print(`PING ${host}…`);
        await new Promise((r) => setTimeout(r, 600));
        return `64 bytes from ${host}: time=${(8 + Math.random() * 20).toFixed(1)} ms`;
      },
    },
    sudo: { hidden: true, run: () => "nice try." },
  };

  return (
    <TerminalShell
      title="guest@mpkcn: ~"
      commands={commands}
      welcome={['Welcome. Type "help" to list commands.']}
      hints={!compact}
      screenClassName={compact ? "h-36" : "h-56"}
    />
  );
}
