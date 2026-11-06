"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type TerminalLine = {
  /** Command typed out after the prompt. Leave it out for an output-only line. */
  command?: string;
  /** Shown once the command has been typed (or right away for an output-only line). */
  output?: ReactNode;
  /** Prompt in front of this command. @default the window's `prompt` */
  prompt?: string;
};

export type TerminalWindowProps = {
  /** Text in the title bar. @default "~ — zsh" */
  title?: ReactNode;
  /** Lines typed out one after the other: a command, then its output. @default [] */
  lines?: TerminalLine[];
  /** Prompt in front of every command. @default "$" */
  prompt?: string;
  /** Milliseconds per typed character. @default 35 */
  typingSpeed?: number;
  /** Pause after each line before the next one starts, in milliseconds. @default 300 */
  lineDelay?: number;
  /** Wait until the window scrolls into view before typing. @default true */
  startOnView?: boolean;
  /** Show an empty prompt with a blinking cursor once everything is typed. @default true */
  idlePrompt?: boolean;
  /** Show the three window dots in the title bar. @default true */
  dots?: boolean;
  /** Extra content on the right of the title bar (buttons, a badge…). */
  actions?: ReactNode;
  /** When set, the title bar gets an "esc" close button that calls it. */
  onClose?: () => void;
  /** Called once every line has been typed. */
  onComplete?: () => void;
  /** Type even when the user prefers reduced motion (e.g. behind an explicit "play" button). Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
  /** Content shown under the typed lines once they finish (or right away when there are none). */
  children?: ReactNode;
  /** Extra classes for the window. */
  className?: string;
  /** Extra classes for the body (padding, height, overflow…). */
  bodyClassName?: string;
};

type Pos = { line: number; chars: number; out: boolean };

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** A blinking block cursor. Stops blinking under reduced motion. */
export function TerminalCursor({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] animate-mpk-blink bg-mpk-blue motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/**
 * A terminal window: title bar with dots, then a body that types out `lines`
 * (command, then output) and finally shows its `children`.
 * Under prefers-reduced-motion every line appears at once.
 * Change its `key` to replay the typing.
 */
export function TerminalWindow({
  title = "~ — zsh",
  lines = [],
  prompt = "$",
  typingSpeed = 35,
  lineDelay = 300,
  startOnView = true,
  idlePrompt = true,
  dots = true,
  actions,
  onClose,
  onComplete,
  ignoreReducedMotion = false,
  children,
  className,
  bodyClassName,
}: TerminalWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(!startOnView);
  const [pos, setPos] = useState<Pos>({ line: 0, chars: 0, out: false });
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const total = lines.length;
  const done = pos.line >= total;
  const current = lines[pos.line];
  const cmdLen = current?.command?.length ?? 0;
  const hasCmd = current?.command !== undefined;

  // Start when scrolled into view.
  useEffect(() => {
    if (started) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setStarted(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  // Reduced motion: show everything at once.
  useEffect(() => {
    if (done || ignoreReducedMotion) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setPos({ line: total, chars: 0, out: false }), 0);
    return () => window.clearTimeout(t);
  }, [done, ignoreReducedMotion, total]);

  // Typing engine: one step per timeout.
  useEffect(() => {
    if (!started || done) return;
    let next: Pos;
    let delay: number;
    if (pos.chars < cmdLen) {
      next = { ...pos, chars: pos.chars + 1 };
      delay = pos.chars === 0 ? Math.max(typingSpeed, 120) : typingSpeed;
    } else if (!pos.out) {
      next = { ...pos, out: true };
      delay = hasCmd ? 140 : 0;
    } else {
      next = { line: pos.line + 1, chars: 0, out: false };
      delay = lineDelay;
    }
    const t = window.setTimeout(() => setPos(next), delay);
    return () => window.clearTimeout(t);
  }, [started, done, pos, cmdLen, hasCmd, typingSpeed, lineDelay]);

  useEffect(() => {
    if (done) onCompleteRef.current?.();
  }, [done]);

  const visible = lines.slice(0, Math.min(pos.line + 1, total));

  return (
    <div
      ref={rootRef}
      className={cx("w-full overflow-hidden border border-mpk-line bg-mpk-bg-soft font-mpk-mono text-mpk-ink", className)}
    >
      <div className="flex items-center gap-3 border-b border-mpk-line px-3.5 py-2 text-xs text-mpk-dim">
        {dots && (
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="size-2.5 bg-mpk-amber" />
            <i className="size-2.5 bg-mpk-dim2" />
            <i className="size-2.5 bg-mpk-blue" />
          </span>
        )}
        <span className="min-w-0 truncate">{title}</span>
        {(actions || onClose) && (
          <span className="ml-auto flex items-center gap-2">
            {actions}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="border border-mpk-line px-1.5 py-px text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-amber"
              >
                esc
              </button>
            )}
          </span>
        )}
      </div>

      <div className={cx("p-4 text-[13px] leading-relaxed", bodyClassName)}>
        {visible.map((line, i) => {
          const isCurrent = i === pos.line;
          const typed = isCurrent ? (line.command ?? "").slice(0, pos.chars) : line.command;
          const showOut = !isCurrent || pos.out;
          const typing = isCurrent && line.command !== undefined && !pos.out;
          return (
            <div key={i} className="mb-1 last:mb-0">
              {line.command !== undefined && (
                <div className="break-words whitespace-pre-wrap">
                  <span className="mr-2 text-mpk-amber">{line.prompt ?? prompt}</span>
                  <span aria-hidden="true">{typed}</span>
                  <span className="sr-only">{line.command}</span>
                  {typing && <TerminalCursor />}
                </div>
              )}
              {showOut && line.output !== undefined && line.output !== null && (
                <div className="break-words whitespace-pre-wrap text-mpk-dim">{line.output}</div>
              )}
            </div>
          );
        })}

        {done && children}

        {done && idlePrompt && (
          <div className={total > 0 || children ? "mt-1" : undefined}>
            <span className="mr-2 text-mpk-amber">{prompt}</span>
            <TerminalCursor />
          </div>
        )}
      </div>
    </div>
  );
}
