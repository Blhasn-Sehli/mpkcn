const TOKENS: { name: string; dark: string; light: string; use: string }[] = [
  { name: "--mpk-bg", dark: "#0a0d10", light: "oklch(0.975 0.006 240)", use: "Page background" },
  { name: "--mpk-bg-soft", dark: "#10151a", light: "oklch(0.945 0.011 240)", use: "Raised surfaces, code, inputs" },
  { name: "--mpk-line", dark: "#1f2b34", light: "oklch(0.86 0.014 240)", use: "Hairline borders and rules" },
  { name: "--mpk-ink", dark: "#eef2f4", light: "oklch(0.21 0.02 250)", use: "Primary text" },
  { name: "--mpk-dim", dark: "#7c8fa0", light: "oklch(0.45 0.022 245)", use: "Secondary text" },
  { name: "--mpk-dim2", dark: "#47555f", light: "oklch(0.5 0.02 245)", use: "Muted text, comments" },
  { name: "--mpk-amber", dark: "#e8a33d", light: "oklch(0.5 0.115 65)", use: "Prompts, cursor, highlights" },
  { name: "--mpk-blue", dark: "#6fb2ff", light: "oklch(0.49 0.17 258)", use: "Links, focus, hover, matrix rain" },
];

function Swatch({ color, bg }: { color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-grid size-7 shrink-0 place-items-center border border-mpk-line" style={{ background: bg }}>
        <span className="size-4" style={{ background: color, outline: "1px solid rgb(127 127 127 / 0.25)" }} />
      </span>
      <code className="font-mpk-mono text-[11px] text-mpk-dim">{color}</code>
    </span>
  );
}

export function TokenTable() {
  return (
    <div className="not-prose my-6 w-full overflow-x-auto border border-mpk-line">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-mpk-line bg-mpk-bg-soft font-mpk-mono text-[11px] tracking-wide text-mpk-dim uppercase">
            <th scope="col" className="px-4 py-2.5 font-medium">
              Variable
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Dark
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Light
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Used for
            </th>
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((t) => (
            <tr key={t.name} className="border-b border-mpk-line last:border-b-0">
              <td className="px-4 py-3 align-middle">
                <code className="font-mpk-mono text-[13px] whitespace-nowrap text-mpk-amber">{t.name}</code>
                <div className="mt-1 font-mpk-mono text-[11px] whitespace-nowrap text-mpk-dim2">
                  {t.name.replace("--mpk-", "bg-mpk-")}
                </div>
              </td>
              <td className="px-4 py-3 align-middle">
                <Swatch color={t.dark} bg="#0a0d10" />
              </td>
              <td className="px-4 py-3 align-middle">
                <Swatch color={t.light} bg="oklch(0.975 0.006 240)" />
              </td>
              <td className="px-4 py-3 align-middle text-mpk-dim">{t.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
