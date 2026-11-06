"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export type ThemeToggleProps = {
  /**
   * "icon": round button with a moon (dark) or sun (light) that swap with a small spin.
   * "text": mono button reading "--dark" / "--light" (the current theme), hairline border.
   * @default "icon"
   */
  variant?: "icon" | "text";
  /** Extra classes for the button. */
  className?: string;
};

const noopSubscribe = () => () => {};

/** false during SSR and hydration, true afterwards: no mismatch, no setState in an effect. */
function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const ICON_BASE =
  "relative inline-grid size-[34px] shrink-0 place-items-center rounded-full text-mpk-dim";
const TEXT_BASE =
  "inline-flex items-center border border-mpk-line px-3 py-1.5 font-mpk-mono text-[13px] leading-none text-mpk-dim";
const FOCUS =
  "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";

/**
 * Switches between the dark and light theme with next-themes.
 * Renders an invisible placeholder of the same size until mounted, so there is
 * no hydration mismatch or layout shift.
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <span aria-hidden="true" className={cx(variant === "icon" ? ICON_BASE : TEXT_BASE, "invisible", className)}>
        {variant === "text" ? "--light" : null}
      </span>
    );
  }

  const isDark = resolvedTheme !== "light";
  const next = isDark ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={label}
        title={label}
        className={cx(
          TEXT_BASE,
          "cursor-pointer bg-transparent transition-colors duration-200 hover:border-mpk-blue hover:text-mpk-blue focus-visible:border-mpk-blue focus-visible:text-mpk-blue",
          FOCUS,
          className,
        )}
      >
        --{isDark ? "dark" : "light"}
      </button>
    );
  }

  const svgBase =
    "absolute transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cx(
        ICON_BASE,
        "cursor-pointer border-0 bg-transparent p-0 transition-[color,background-color,transform] duration-200",
        "hover:-translate-y-0.5 hover:scale-[1.08] hover:bg-mpk-blue/15 hover:text-mpk-blue",
        "focus-visible:bg-mpk-blue/15 focus-visible:text-mpk-ink motion-reduce:hover:transform-none",
        FOCUS,
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cx(svgBase, isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-[0.4] opacity-0")}
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={cx(svgBase, isDark ? "rotate-90 scale-[0.4] opacity-0" : "rotate-0 scale-100 opacity-100")}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
