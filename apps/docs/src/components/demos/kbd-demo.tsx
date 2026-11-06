import { Kbd } from "@/registry/kbd";

const ROWS: { keys: string | string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "open command palette" },
  { keys: ["Shift", "?"], label: "show shortcuts" },
  { keys: "Esc", label: "close" },
  { keys: ["j", "k"], label: "next / previous" },
];

/** A small shortcut sheet built from Kbd badges. */
export function KbdDemo({ compact = false }: { compact?: boolean }) {
  const rows = compact ? ROWS.slice(0, 3) : ROWS;
  return (
    <div className="w-full max-w-sm">
      <dl className="flex flex-col font-mpk-mono text-xs text-mpk-dim">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 border-t border-mpk-line py-2.5 last:border-b">
            <dt>{r.label}</dt>
            <dd className="m-0">
              <Kbd keys={r.keys} separator={r.label.includes("/") ? "/" : "+"} size={compact ? "sm" : "md"} />
            </dd>
          </div>
        ))}
      </dl>
      {!compact && (
        <p className="mt-4 font-mpk-mono text-[11px] text-mpk-dim2">
          press <Kbd keys="?" size="sm" /> for help
        </p>
      )}
    </div>
  );
}
