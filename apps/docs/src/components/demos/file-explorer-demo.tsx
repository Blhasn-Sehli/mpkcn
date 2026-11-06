"use client";

import { useState } from "react";
import { FileExplorer, type FileExplorerProps, type FileNode } from "@/registry/file-explorer";
import { MediaLightbox, type LightboxItem } from "@/registry/media-lightbox";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos`;

const TREE: FileNode[] = [
  {
    name: "projects",
    children: [
      {
        name: "atlas",
        meta: "2026",
        description: "A map viewer that streams vector tiles and keeps working offline.",
        image: { src: `${BASE}/sample-dunes.svg`, alt: "Dunes under an orange sky" },
        details: [
          { label: "status", value: "shipped" },
          { label: "stack", value: "Next.js, MapLibre, IndexedDB" },
        ],
        keywords: ["maps", "offline"],
      },
      {
        name: "relay",
        meta: "2025",
        description: "A tiny webhook relay with retries and a live log.",
        image: { src: `${BASE}/sample-grid.svg`, alt: "Two boxes labelled api and web on a grid" },
        details: [
          { label: "status", value: "beta" },
          { label: "stack", value: "Go, SQLite" },
        ],
        keywords: ["webhooks", "go"],
      },
      {
        name: "nightly",
        meta: "2024",
        description: "A photo journal that only publishes after dark.",
        image: { src: `${BASE}/sample-night.svg`, alt: "A city skyline at night" },
        details: [{ label: "status", value: "archived" }],
      },
    ],
  },
  {
    name: "notes",
    children: [
      { name: "todo.md", meta: "1 KB", description: "Ship the file explorer. Write the docs. Sleep." },
      { name: "ideas.md", meta: "3 KB", description: "A terminal-style everything." },
    ],
  },
  { name: "archive", children: [] },
  { name: "readme.md", meta: "2 KB", description: "Use the arrow keys, Enter and Esc. Press / to filter." },
];

// Example of renderPreview: a `stat`-like printout of the selected file.
function statPreview(node: FileNode, path: FileNode[]) {
  return (
    <div className="text-[12px] leading-relaxed text-mpk-dim">
      <p className="m-0">
        <span className="text-mpk-amber">$</span> stat {path.map((n) => n.name).join("/")}
      </p>
      <p className="m-0">
        name: <span className="text-mpk-ink">{node.name}</span>
      </p>
      <p className="m-0">
        depth: <span className="text-mpk-ink">{path.length}</span>
      </p>
      {node.meta !== undefined && (
        <p className="m-0">
          meta: <span className="text-mpk-ink">{node.meta}</span>
        </p>
      )}
    </div>
  );
}

/** A FileExplorer over a small fake home folder. Enter on a project opens its picture in a lightbox inside the box. */
export function FileExplorerDemo({
  compact = false,
  customPreview = false,
  ...props
}: Partial<FileExplorerProps> & { compact?: boolean; customPreview?: boolean }) {
  const [shots, setShots] = useState<{ items: LightboxItem[]; start: number } | null>(null);

  const openShots = (node: FileNode, path: FileNode[]) => {
    const siblings = path.length > 1 ? (path[path.length - 2].children ?? []) : [node];
    const items: LightboxItem[] = [];
    let start = 0;
    for (const n of siblings) {
      if (!n.image) continue;
      if (n === node) start = items.length;
      items.push({ src: n.image.src, alt: n.image.alt, caption: n.name });
    }
    if (items.length) setShots({ items, start });
  };

  return (
    <div className="relative w-full">
      <FileExplorer
        items={TREE}
        defaultPath={["projects", "atlas"]}
        height={compact ? 220 : 380}
        onOpen={openShots}
        renderPreview={customPreview ? statPreview : undefined}
        {...props}
      />
      <MediaLightbox
        items={shots?.items ?? []}
        open={shots !== null}
        onOpenChange={(open) => {
          if (!open) setShots(null);
        }}
        startIndex={shots?.start}
        title="~/projects"
        portal={false}
      />
    </div>
  );
}
