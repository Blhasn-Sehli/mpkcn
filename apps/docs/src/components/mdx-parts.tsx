import type { ReactNode } from "react";
import { InfoIcon, WarnIcon } from "./icons";

export type PropRow = {
  prop: string;
  type: string;
  default?: string;
  description: ReactNode;
};

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="not-prose my-6 w-full overflow-x-auto border border-mpk-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-mpk-line bg-mpk-bg-soft font-mpk-mono text-[11px] tracking-wide text-mpk-dim uppercase">
            <th scope="col" className="px-4 py-2.5 font-medium">
              Prop
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Default
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prop} className="border-b border-mpk-line align-top last:border-b-0">
              <td className="px-4 py-3 font-mpk-mono text-[13px] whitespace-nowrap text-mpk-amber">{row.prop}</td>
              <td className="px-4 py-3 font-mpk-mono text-[12px] text-mpk-blue">{row.type}</td>
              <td className="px-4 py-3 font-mpk-mono text-[12px] whitespace-nowrap text-mpk-dim">{row.default ?? "—"}</td>
              <td className="px-4 py-3 leading-relaxed text-mpk-dim">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({
  children,
  type = "info",
  title,
}: {
  children: ReactNode;
  type?: "info" | "warn";
  title?: string;
}) {
  const warn = type === "warn";
  return (
    <aside
      className={`not-prose my-6 flex gap-3 border border-l-2 border-mpk-line bg-mpk-bg-soft px-4 py-3.5 text-sm leading-relaxed text-mpk-dim ${
        warn ? "border-l-mpk-amber" : "border-l-mpk-blue"
      }`}
    >
      {warn ? (
        <WarnIcon className="mt-0.5 shrink-0 text-mpk-amber" />
      ) : (
        <InfoIcon className="mt-0.5 shrink-0 text-mpk-blue" />
      )}
      <div className="min-w-0 [&_a]:text-mpk-blue [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:font-mpk-mono [&_code]:text-[0.85em] [&_code]:text-mpk-ink [&>p+p]:mt-2">
        {title && <p className="mb-1 font-medium text-mpk-ink">{title}</p>}
        {children}
      </div>
    </aside>
  );
}

/** Numbers every h3 inside (### Step) with a hairline rail. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="mpk-steps my-8">{children}</div>;
}
