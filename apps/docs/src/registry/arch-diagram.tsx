"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

export type ArchNode = {
  /** Unique id, used by `links`. */
  id: string;
  /** Text in the box. Keep it short (about 12 characters). */
  label: string;
  /** Column, from 0 on the left. */
  col: number;
  /** Row, from 0 at the top. */
  row: number;
  /** Shown highlighted after the label in the detail line, e.g. a list of tools. */
  tags?: string[];
  /** Second, dimmed detail line. */
  note?: ReactNode;
};

export type ArchDiagramProps = {
  /** Boxes, placed on a grid by `col` and `row`. */
  nodes: ArchNode[];
  /** Connections as [fromId, toId] pairs. */
  links?: [string, string][];
  /** Node selected at first. @default the first node */
  defaultActive?: string;
  /** Called when a node is selected. */
  onSelect?: (node: ArchNode) => void;
  /** Command shown above the diagram. Pass null to hide it. @default "tree . --arch" */
  command?: string | null;
  /** Accessible name of the diagram. @default "Architecture diagram" */
  label?: string;
  /** Extra classes for the root. */
  className?: string;
};

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

const CELL_W = 160;
const CELL_H = 100;
const W = 120;
const H = 44;
const PAD = 20;

/**
 * A small architecture diagram: boxes on a grid joined by right-angled lines.
 * Selecting a box (click, Enter or Space; arrow keys move between boxes)
 * highlights it and its links and prints its details under the diagram.
 */
export function ArchDiagram({
  nodes,
  links = [],
  defaultActive,
  onSelect,
  command = "tree . --arch",
  label = "Architecture diagram",
  className,
}: ArchDiagramProps) {
  const [active, setActive] = useState(defaultActive ?? nodes[0]?.id ?? "");
  const detailId = useId();
  const node = nodes.find((n) => n.id === active);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const cols = Math.max(0, ...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(0, ...nodes.map((n) => n.row)) + 1;
  const vw = cols * CELL_W - (CELL_W - W) + PAD * 2;
  const vh = rows * CELL_H - (CELL_H - H) + PAD * 2;
  const pos = (n: ArchNode) => ({ x: PAD + n.col * CELL_W, y: PAD + n.row * CELL_H });

  const select = (n: ArchNode) => {
    setActive(n.id);
    onSelect?.(n);
  };

  const focusNode = (id: string) => {
    document.getElementById(`${detailId}-${id}`)?.focus();
  };

  const onKey = (e: KeyboardEvent<SVGGElement>, n: ArchNode) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(n);
      return;
    }
    const dir: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const d = dir[e.key];
    if (!d) return;
    e.preventDefault();
    // Nearest node in that direction, preferring the same row / column.
    let best: ArchNode | null = null;
    let bestScore = Infinity;
    for (const m of nodes) {
      const dc = m.col - n.col;
      const dr = m.row - n.row;
      const along = dc * d[0] + dr * d[1];
      if (along <= 0) continue;
      const across = Math.abs(d[0] ? dr : dc);
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    }
    if (best) focusNode(best.id);
  };

  const path = (a: ArchNode, b: ArchNode) => {
    const p = pos(a);
    const q = pos(b);
    if (a.row === b.row) {
      const [l, r] = p.x < q.x ? [p, q] : [q, p];
      return `M${l.x + W} ${l.y + H / 2}H${r.x}`;
    }
    const [t, u] = p.y < q.y ? [p, q] : [q, p];
    const x1 = t.x + W / 2;
    const x2 = u.x + W / 2;
    const midY = t.y + H + (u.y - t.y - H) / 2;
    return x1 === x2 ? `M${x1} ${t.y + H}V${u.y}` : `M${x1} ${t.y + H}V${midY}H${x2}V${u.y}`;
  };

  return (
    <div className={cx("w-full border border-mpk-line bg-mpk-bg-soft p-4 font-mpk-mono text-[13px] text-mpk-ink", className)}>
      {command !== null && (
        <div className="mb-3 text-mpk-dim">
          <span className="mr-2 text-mpk-amber">$</span>
          {command}
        </div>
      )}
      <svg viewBox={`0 0 ${vw} ${vh}`} role="group" aria-label={label} className="block h-auto w-full">
        {/* Lit links last, so shared segments are drawn on top in blue. */}
        {[...links].sort((l, m) => Number(l.includes(active)) - Number(m.includes(active))).map(([a, b]) => {
          const from = byId.get(a);
          const to = byId.get(b);
          if (!from || !to) return null;
          const on = a === active || b === active;
          return (
            <path
              key={`${a}-${b}`}
              d={path(from, to)}
              fill="none"
              strokeWidth={on ? 1.5 : 1}
              className={cx("transition-colors", on ? "stroke-mpk-blue" : "stroke-mpk-line")}
            />
          );
        })}
        {nodes.map((n) => {
          const { x, y } = pos(n);
          const on = n.id === active;
          return (
            <g
              key={n.id}
              id={`${detailId}-${n.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-describedby={on ? detailId : undefined}
              onClick={() => select(n)}
              onKeyDown={(e) => onKey(e, n)}
              className="group cursor-pointer outline-none"
            >
              <rect
                x={x}
                y={y}
                width={W}
                height={H}
                strokeWidth={1}
                className={cx(
                  "transition-colors group-focus-visible:stroke-mpk-amber",
                  on ? "fill-mpk-blue/10 stroke-mpk-blue" : "fill-mpk-bg stroke-mpk-line group-hover:stroke-mpk-dim",
                )}
              />
              <text
                x={x + W / 2}
                y={y + H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className={cx("font-mpk-mono text-[13px] transition-colors", on ? "fill-mpk-blue" : "fill-mpk-dim group-hover:fill-mpk-ink")}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div id={detailId} aria-live="polite" className="mt-3 min-h-[3.2em] border-t border-mpk-line pt-3 leading-relaxed">
        {node && (
          <>
            <div className="break-words">
              <span className="text-mpk-amber">{node.label}</span>
              {node.tags && node.tags.length > 0 && <span className="text-mpk-ink"> {node.tags.join(" / ")}</span>}
            </div>
            {node.note && <div className="text-mpk-dim">{node.note}</div>}
          </>
        )}
      </div>
    </div>
  );
}
