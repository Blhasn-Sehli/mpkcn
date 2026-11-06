"use client";

import { EnvCard, type EnvLine } from "@/registry/env-card";

const ENTRIES: EnvLine[] = [
  { comment: "reach me" },
  { key: "EMAIL", value: "you@example.com", href: "mailto:you@example.com" },
  { key: "GITHUB", value: "github.com/you", href: "https://github.com/you", copyValue: "https://github.com/you" },
  { key: "STATUS", value: "open_to_work", live: true, copy: false },
  { key: "TIMEZONE", value: "UTC+1", copy: false, comment: "replies within a day" },
  { key: "MAX_PROJECTS", value: "2", copy: false },
  { key: "API_TOKEN", value: "not-a-real-token-42", secret: true },
];

/** Contact details as a .env file, with links, a live status and a masked secret. */
export function EnvCardDemo({ compact = false }: { compact?: boolean }) {
  return (
    <EnvCard
      filename=".env.contact"
      entries={compact ? ENTRIES.slice(1, 5) : ENTRIES}
      className={compact ? "text-xs" : undefined}
    />
  );
}
