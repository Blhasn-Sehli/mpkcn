"use client";

import { ArchDiagram, type ArchNode } from "@/registry/arch-diagram";

const NODES: ArchNode[] = [
  { id: "web", label: "Web", col: 0, row: 0, tags: ["React", "Next.js"], note: "server components, static export" },
  { id: "api", label: "API", col: 1, row: 0, tags: ["Node.js", "REST"], note: "one service, versioned routes" },
  { id: "db", label: "Data", col: 2, row: 0, tags: ["PostgreSQL"], note: "daily backups" },
  { id: "auth", label: "Auth", col: 0, row: 1, tags: ["JWT", "RBAC"], note: "4 roles" },
  { id: "queue", label: "Jobs", col: 1, row: 1, tags: ["Redis", "workers"], note: "emails and exports" },
  { id: "ops", label: "Ops", col: 2, row: 1, tags: ["Docker", "CI"], note: "deploys on every merge" },
];

const LINKS: [string, string][] = [
  ["web", "api"],
  ["api", "db"],
  ["api", "auth"],
  ["api", "queue"],
  ["api", "ops"],
];

/** A six-box architecture: pick a box to light up its links and print its details. */
export function ArchDiagramDemo({ compact = false }: { compact?: boolean }) {
  return (
    <ArchDiagram
      nodes={compact ? NODES.slice(0, 3) : NODES}
      links={compact ? LINKS.slice(0, 2) : LINKS}
      defaultActive="api"
      command={compact ? null : "tree ./app --arch"}
      className={compact ? "p-3 text-xs" : undefined}
    />
  );
}
