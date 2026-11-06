import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/terminal-shell.mdx";

export const metadata = docMetadata("terminal-shell");

export default function TerminalShellPage() {
  return (
    <DocShell slug="terminal-shell">
      <Content />
    </DocShell>
  );
}
