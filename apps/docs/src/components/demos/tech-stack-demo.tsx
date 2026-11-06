"use client";

import { TechStack, type TechGroup, type TechStackProps } from "@/registry/tech-stack";

// Plain geometric glyphs: stand-ins for the brand icons you would pass in.
const Square = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2.5" y="2.5" width="11" height="11" />
  </svg>
);
const Circle = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="5.5" />
  </svg>
);
const Triangle = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2.5l6 11H2z" />
  </svg>
);
const Diamond = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 1.5l6.5 6.5L8 14.5 1.5 8z" />
  </svg>
);

const GROUPS: TechGroup[] = [
  {
    label: "language",
    items: [
      { name: "TypeScript", icon: <Square />, details: { since: 2021, daily: true, used_in: ["web app", "cli"] } },
      { name: "Python", icon: <Square />, details: { since: 2019, daily: false, used_in: ["scripts"] } },
    ],
  },
  {
    label: "frontend",
    items: [
      { name: "React", icon: <Circle />, details: { since: 2021, used_in: ["web app", "docs site"] } },
      { name: "Next.js", icon: <Circle />, details: { since: 2022, router: "app", used_in: ["docs site"] } },
      { name: "Tailwind", icon: <Circle />, details: { version: "4", used_in: ["docs site"] } },
    ],
  },
  {
    label: "backend",
    items: [
      { name: "Node.js", icon: <Triangle />, details: { runtime: "22 LTS", used_in: ["api", "cli"] } },
      { name: "PostgreSQL", icon: <Triangle />, details: { since: 2022, used_in: ["api"] } },
    ],
  },
  {
    label: "ops",
    items: [
      { name: "Docker", icon: <Diamond />, details: { used_in: ["api"] } },
      { name: "Git", icon: <Diamond />, details: { daily: true, used_in: [] } },
    ],
  },
];

/** A stack.json with four categories; pick a chip to print its details. */
export function TechStackDemo({
  compact = false,
  variant = "json",
  detail,
}: Pick<TechStackProps, "variant" | "detail"> & { compact?: boolean }) {
  return (
    <TechStack
      groups={compact ? GROUPS.slice(0, 3) : GROUPS}
      variant={variant}
      detail={detail ?? !compact}
      className={compact ? "text-xs" : undefined}
    />
  );
}
