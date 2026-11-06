"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { TerminalWindow } from "./terminal-window";

/** What a command prints: one node, several lines, or nothing. */
export type ShellOutput = ReactNode | ReactNode[];

export type ShellContext = {
  /** Every command entered so far, oldest first. */
  history: string[];
  /** Empties the screen. */
  clear: () => void;
  /** Prints extra lines right away (handy before an async command resolves). */
  print: (output: ShellOutput) => void;
};

export type ShellCommand = {
  /** One line shown by the built-in `help`. */
  description?: string;
  /** Usage shown by `help`, e.g. "theme <dark|light>". @default the command name */
  usage?: string;
  /** Leave it out of `help` and tab completion (easter eggs). @default false */
  hidden?: boolean;
  /** Runs the command. `args` are the words after the name. May be async. */
  run: (args: string[], ctx: ShellContext) => ShellOutput | void | Promise<ShellOutput | void>;
};

export type TerminalShellProps = {
  /** Your commands, by name. A plain function works too. @default {} */
  commands?: Record<string, ShellCommand | ShellCommand["run"]>;
  /** Add the built-in `help`, `clear` and `history` commands (yours win on a name clash). @default true */
  builtins?: boolean;
  /** Lines printed when the shell starts. @default ['Type "help" to list commands.'] */
  welcome?: ReactNode[];
  /** Prompt in front of the input and of every past command. @default "$" */
  prompt?: string;
  /** Text in the title bar. @default "~ — sh" */
  title?: ReactNode;
  /** Output for an unknown command. @default `${name}: command not found. Type "help".` */
  notFound?: (name: string) => ShellOutput;
  /** Accessible name of the input. @default "Terminal input" */
  inputLabel?: string;
  /** Placeholder in the empty input. */
  placeholder?: string;
  /** Focus the input on mount. Leave off unless the shell is the main thing on screen. @default false */
  autoFocus?: boolean;
  /** Show the key-hint footer. @default true */
  hints?: boolean;
  /** Most lines kept on screen; older ones are dropped. @default 300 */
  maxLines?: number;
  /** When set, the title bar gets an "esc" close button, and Esc in the input calls it. */
  onClose?: () => void;
  /** Extra classes for the window. */
  className?: string;
  /** Extra classes for the scrolling screen (set its height here). @default "h-72" */
  screenClassName?: string;
};

type Entry = { id: number; kind: "cmd" | "out"; content: ReactNode };

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function toLines(out: ShellOutput | void): ReactNode[] {
  if (out === undefined || out === null || out === false) return [];
  return Array.isArray(out) ? out : [out];
}

function normalize(c: ShellCommand | ShellCommand["run"]): ShellCommand {
  return typeof c === "function" ? { run: c } : c;
}

const DEFAULT_WELCOME: ReactNode[] = ['Type "help" to list commands.'];

/**
 * An interactive fake shell in a terminal window. You pass the commands; it
 * handles the prompt, history (↑ ↓), tab completion, Ctrl+L and Ctrl+C, and
 * the built-in `help`, `clear` and `history`.
 */
export function TerminalShell({
  commands = {},
  builtins = true,
  welcome = DEFAULT_WELCOME,
  prompt = "$",
  title = "~ — sh",
  notFound = (name) => `${name}: command not found. Type "help".`,
  inputLabel = "Terminal input",
  placeholder,
  autoFocus = false,
  hints = true,
  maxLines = 300,
  onClose,
  className,
  screenClassName = "h-72",
}: TerminalShellProps) {
  const idRef = useRef(0);
  const [entries, setEntries] = useState<Entry[]>(() => welcome.map((content, i) => ({ id: -1 - i, kind: "out", content })));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // Your commands plus the built-ins.
  const table: Record<string, ShellCommand> = {};
  if (builtins) {
    table.help = {
      description: "list commands",
      run: () => {
        const rows = Object.entries(table).filter(([, c]) => !c.hidden);
        const width = Math.max(...rows.map(([n, c]) => (c.usage ?? n).length)) + 3;
        return rows.map(([n, c]) => `${(c.usage ?? n).padEnd(width)}${c.description ?? ""}`);
      },
    };
    table.clear = { description: "clear the screen (Ctrl+L)", run: (_, ctx) => ctx.clear() };
    table.history = {
      description: "show past commands",
      run: (_, ctx) => ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`),
    };
  }
  for (const [name, c] of Object.entries(commands)) table[name.toLowerCase()] = normalize(c);
  const names = Object.keys(table).filter((n) => !table[n].hidden);

  function push(kind: Entry["kind"], lines: ReactNode[]) {
    if (lines.length === 0) return;
    setEntries((prev) => {
      const next = [...prev, ...lines.map((content) => ({ id: idRef.current++, kind, content }))];
      return next.length > maxLines ? next.slice(-maxLines) : next;
    });
  }

  async function submit() {
    const raw = value;
    const trimmed = raw.trim();
    setValue("");
    setHIndex(-1);
    push("cmd", [raw]);
    if (!trimmed) return;
    const nextHistory = [...history, trimmed];
    setHistory(nextHistory);

    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = table[name.toLowerCase()];
    if (!cmd) {
      push("out", toLines(notFound(name)));
      return;
    }
    const ctx: ShellContext = {
      history: nextHistory,
      clear: () => setEntries([]),
      print: (out) => push("out", toLines(out)),
    };
    try {
      const result = cmd.run(args, ctx);
      if (result instanceof Promise) {
        setBusy(true);
        push("out", toLines(await result));
      } else {
        push("out", toLines(result));
      }
    } catch (err) {
      push("out", [`${name}: ${err instanceof Error ? err.message : "failed"}`]);
    } finally {
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!busy) void submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hIndex + 1, history.length - 1);
      if (n >= 0) {
        setHIndex(n);
        setValue(history[history.length - 1 - n]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = Math.max(hIndex - 1, -1);
      setHIndex(n);
      setValue(n < 0 ? "" : history[history.length - 1 - n]);
    } else if (e.key === "Tab" && value.trim() && !value.includes(" ")) {
      // Only complete the command name; an empty input lets Tab move focus as usual.
      e.preventDefault();
      const word = value.trim().toLowerCase();
      const matches = names.filter((n) => n.startsWith(word));
      if (matches.length === 1) setValue(`${matches[0]} `);
      else if (matches.length > 1) {
        push("cmd", [value]);
        push("out", [matches.join("  ")]);
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setEntries([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
      e.preventDefault();
      push("cmd", [`${value}^C`]);
      setValue("");
      setHIndex(-1);
    } else if (e.key === "Escape" && onClose) {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <TerminalWindow title={title} onClose={onClose} idlePrompt={false}
      className={cx("transition-colors focus-within:border-mpk-blue", className)}
      bodyClassName="p-0"
    >
      <div
        ref={screenRef}
        className={cx("overflow-y-auto px-4 py-3", screenClassName)}
        onClick={() => {
          // Clicking the screen focuses the input, unless the user is selecting text.
          if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <div role="log" aria-live="polite" aria-relevant="additions">
          {entries.map((entry) =>
            entry.kind === "cmd" ? (
              <div key={entry.id} className="break-words whitespace-pre-wrap text-mpk-ink">
                <span className="mr-2 text-mpk-amber">{prompt}</span>
                {entry.content}
              </div>
            ) : (
              <div key={entry.id} className="break-words whitespace-pre-wrap text-mpk-dim">
                {entry.content === "" ? " " : entry.content}
              </div>
            ),
          )}
        </div>
        <div className="flex items-center">
          <label htmlFor={inputId} className="mr-2 text-mpk-amber">
            <span aria-hidden="true">{prompt}</span>
            <span className="sr-only">{inputLabel}</span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHIndex(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-busy={busy || undefined}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent text-mpk-ink caret-mpk-blue outline-none placeholder:text-mpk-dim2"
          />
        </div>
      </div>
      {hints && (
        <div className="border-t border-mpk-line px-4 py-1.5 text-[11px] text-mpk-dim2">
          ⏎ run · tab complete · ↑↓ history · ctrl+l clear{onClose ? " · esc close" : ""}
        </div>
      )}
    </TerminalWindow>
  );
}
