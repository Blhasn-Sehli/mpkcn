"use client";

import { TerminalForm, type TerminalFormField } from "@/registry/terminal-form";

const FIELDS: TerminalFormField[] = [
  { name: "name", autoComplete: "name", placeholder: "your name" },
  { name: "email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { name: "msg", type: "textarea", rows: 3, placeholder: "what are you building?" },
];

/** TerminalForm in a bordered box. Submitting only waits a moment; nothing is sent. */
export function TerminalFormDemo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`w-full border border-mpk-line bg-mpk-bg-soft ${compact ? "min-h-[150px] p-3" : "min-h-[220px] p-4"}`}>
      <TerminalForm
        fields={compact ? FIELDS.slice(0, 2) : FIELDS}
        command={compact ? "subscribe" : "send --message"}
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 700));
          return `done. thanks, ${values.name}. (demo: nothing was sent)`;
        }}
      />
    </div>
  );
}
