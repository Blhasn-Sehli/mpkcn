"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type EnvEntry = {
  /** Variable name, e.g. "EMAIL". */
  key: string;
  /** Value, shown in quotes unless it is a number or true / false. */
  value: string;
  /** Turns the value into a link. http(s) links open in a new tab. */
  href?: string;
  /** Mask the value with dots behind a show / hide toggle. The copy button still copies the real value. */
  secret?: boolean;
  /** Show a copy button for this line. @default the card's `copyable` */
  copy?: boolean;
  /** Text copied instead of `value`, e.g. a full URL. */
  copyValue?: string;
  /** A blinking dot in front of the value, for a live status. */
  live?: boolean;
  /** Trailing comment after the value, shown dimmed. */
  comment?: string;
};

/** A line of the file: a variable, or a comment line on its own. */
export type EnvLine = EnvEntry | { comment: string };

export type EnvCardProps = {
  /** Lines of the file, top to bottom. */
  entries: EnvLine[];
  /** File name in the header. Pass null to hide the header. @default ".env" */
  filename?: string | null;
  /** Show line numbers (hidden on narrow containers). @default true */
  lineNumbers?: boolean;
  /** Give every variable a copy button unless the entry says otherwise. @default true */
  copyable?: boolean;
  /** Character used to mask secrets. @default "•" */
  maskChar?: string;
  /** Extra content on the right of the header. */
  actions?: ReactNode;
  /** Extra classes for the card. */
  className?: string;
};

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

const BTN =
  "shrink-0 border border-mpk-line px-1.5 py-px text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-mpk-amber";

function isBare(v: string) {
  return /^(true|false|-?\d+(\.\d+)?)$/.test(v);
}

function Row({
  entry,
  n,
  lineNumbers,
  copyable,
  maskChar,
  copied,
  onCopy,
}: {
  entry: EnvEntry;
  n: number;
  lineNumbers: boolean;
  copyable: boolean;
  maskChar: string;
  copied: "ok" | "fail" | null;
  onCopy: (entry: EnvEntry) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = entry.secret && !revealed;
  const bare = isBare(entry.value);
  const text = masked ? maskChar.repeat(Math.min(Math.max(entry.value.length, 8), 24)) : entry.value;
  const shown = bare || masked ? text : `"${text}"`;
  const external = entry.href ? /^https?:\/\//.test(entry.href) : false;
  const canCopy = entry.copy ?? copyable;

  const valueCls = cx("min-w-0 truncate", bare ? "text-mpk-amber" : "text-mpk-blue", masked && "tracking-widest");

  return (
    <li className="flex items-baseline gap-2 py-1">
      {lineNumbers && (
        <span aria-hidden="true" className="hidden w-[2ch] shrink-0 text-right text-mpk-dim2 select-none @sm:inline">
          {n}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-baseline">
        <span className="shrink-0 text-mpk-amber">{entry.key}</span>
        <span className="shrink-0 text-mpk-dim2">=</span>
        {entry.live && (
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block size-[7px] shrink-0 animate-mpk-blink self-center bg-mpk-blue motion-reduce:animate-none"
          />
        )}
        {masked && <span className="sr-only">hidden value</span>}
        {entry.href && !masked ? (
          <a
            href={entry.href}
            className={cx(
              valueCls,
              "underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:decoration-current focus-visible:outline-none",
            )}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {shown}
          </a>
        ) : (
          <span className={valueCls} aria-hidden={masked || undefined}>
            {shown}
          </span>
        )}
        {entry.comment && <span className="ml-2 hidden truncate text-mpk-dim2 @md:inline"># {entry.comment}</span>}
      </span>
      {entry.secret && (
        <button
          type="button"
          className={BTN}
          aria-pressed={revealed}
          aria-label={`${revealed ? "Hide" : "Show"} ${entry.key}`}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? "hide" : "show"}
        </button>
      )}
      {canCopy && (
        <button type="button" className={BTN} aria-label={`Copy ${entry.key}`} onClick={() => onCopy(entry)}>
          {copied === "ok" ? "copied ✓" : copied === "fail" ? "failed" : "copy"}
        </button>
      )}
    </li>
  );
}

/**
 * Contact or config details shown as a .env file: keys in amber, values in
 * blue (numbers and booleans in amber), comments dimmed. Values can be links,
 * secrets are masked behind a show / hide toggle, and each line can be copied.
 */
export function EnvCard({
  entries,
  filename = ".env",
  lineNumbers = true,
  copyable = true,
  maskChar = "•",
  actions,
  className,
}: EnvCardProps) {
  const [copied, setCopied] = useState<{ key: string; state: "ok" | "fail" } | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async (entry: EnvEntry) => {
    let state: "ok" | "fail" = "ok";
    try {
      await navigator.clipboard.writeText(entry.copyValue ?? entry.value);
    } catch {
      state = "fail";
    }
    setCopied({ key: entry.key, state });
    setStatus(state === "ok" ? `${entry.key} copied to clipboard` : `Could not copy ${entry.key}`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(null);
      setStatus("");
    }, 1800);
  };

  return (
    <div className={cx("@container w-full border border-mpk-line bg-mpk-bg-soft font-mpk-mono text-[13px] text-mpk-ink", className)}>
      {filename !== null && (
        <div className="flex items-center gap-3 border-b border-mpk-line px-3.5 py-2 text-xs text-mpk-dim">
          <span className="min-w-0 truncate">
            <span className="text-mpk-dim2"># </span>
            {filename}
          </span>
          {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
        </div>
      )}
      <ul className="m-0 list-none px-3.5 py-3 @md:px-4.5">
        {entries.map((line, i) => {
          if (!("key" in line)) {
            return (
              <li key={`c-${i}`} className="flex gap-2 py-1 text-mpk-dim2">
                {lineNumbers && (
                  <span aria-hidden="true" className="hidden w-[2ch] shrink-0 text-right select-none @sm:inline">
                    {i + 1}
                  </span>
                )}
                <span className="min-w-0 break-words"># {line.comment}</span>
              </li>
            );
          }
          return (
            <Row
              key={line.key}
              entry={line}
              n={i + 1}
              lineNumbers={lineNumbers}
              copyable={copyable}
              maskChar={maskChar}
              copied={copied?.key === line.key ? copied.state : null}
              onCopy={onCopy}
            />
          );
        })}
      </ul>
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </div>
  );
}
