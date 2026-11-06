import { Fragment, type ReactNode } from "react";

export type KbdProps = {
  /**
   * The key, or the keys of a combo, e.g. "K" or ["Ctrl", "K"].
   * Ignored when `children` is set.
   */
  keys?: string | string[];
  /** Custom content for a single key. Takes precedence over `keys`. */
  children?: ReactNode;
  /** Text shown between the keys of a combo. @default "+" */
  separator?: ReactNode;
  /** "sm" for inline hints in small text, "md" for body text. @default "md" */
  size?: "sm" | "md";
  /** Extra classes for the outer element. */
  className?: string;
};

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const KEY =
  "inline-flex items-center justify-center border border-b-2 border-mpk-line bg-mpk-bg font-mpk-mono leading-none text-mpk-ink";
const SIZE = {
  sm: "min-w-[1.6em] px-1 py-0.5 text-[11px]",
  md: "min-w-[1.8em] px-1.5 py-1 text-xs",
} as const;

/**
 * A keyboard key badge in the mpkcn style: hairline border, thicker bottom edge,
 * square corners, mono text. Pass an array to show a combo like Ctrl + K.
 * Combos follow the HTML spec: one outer <kbd> wrapping one <kbd> per key.
 */
export function Kbd({ keys, children, separator = "+", size = "md", className }: KbdProps) {
  const list = children !== undefined ? null : Array.isArray(keys) ? keys : keys !== undefined ? [keys] : [];

  if (list === null || list.length === 1) {
    return <kbd className={cx(KEY, SIZE[size], className)}>{list === null ? children : list[0]}</kbd>;
  }

  return (
    <kbd className={cx("inline-flex items-center gap-1 font-mpk-mono text-mpk-dim2", size === "sm" ? "text-[11px]" : "text-xs", className)}>
      {list.map((k, i) => (
        <Fragment key={`${k}-${i}`}>
          {i > 0 && <span>{separator}</span>}
          <kbd className={cx(KEY, SIZE[size])}>{k}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}
