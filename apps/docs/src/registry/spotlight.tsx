"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties, type PointerEvent } from "react";

export type SpotlightProps = ComponentPropsWithoutRef<"div"> & {
  /** Accent the glow is tinted with. @default "blue" */
  color?: "blue" | "amber";
  /** Diameter of the glow circle in px. @default 360 */
  size?: number;
  /** Glow strength from 0 to 1 on the dark theme (the light theme uses half). @default 0.14 */
  strength?: number;
  /** Follow the pointer even when the user prefers reduced motion. Use sparingly. @default false */
  ignoreReducedMotion?: boolean;
};

/**
 * A panel with a soft glow that follows the pointer while it hovers. The glow
 * is a CSS radial gradient positioned from two custom properties, so moving it
 * never re-renders React. Touch screens and reduced motion get no glow.
 */
export function Spotlight({
  color = "blue",
  size = 360,
  strength = 0.14,
  ignoreReducedMotion = false,
  className = "",
  style,
  children,
  onPointerMove,
  ...props
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(
      ignoreReducedMotion ? "(hover: none)" : "(hover: none), (prefers-reduced-motion: reduce)",
    );
    const sync = () => {
      enabled.current = !mq.matches;
      if (!enabled.current) ref.current?.removeAttribute("data-active");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [ignoreReducedMotion]);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || !enabled.current || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.setAttribute("data-active", "");
  };

  const pct = Math.round(Math.min(1, Math.max(0, strength)) * 100);
  const vars = {
    "--mpk-spot": `${pct}%`,
    "--mpk-spot-light": `${Math.round(pct / 2)}%`,
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      {...props}
      style={vars}
      onPointerMove={handleMove}
      className={`group/spot relative isolate ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:group-data-[active]/spot:opacity-100 [.light_&]:[--mpk-spot:var(--mpk-spot-light)]"
        style={{
          background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--mpk-${color}) var(--mpk-spot), transparent), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
