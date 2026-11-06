import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/terminal-window.mdx";

export const metadata = docMetadata("terminal-window");

export default function TerminalWindowPage() {
  return (
    <DocShell slug="terminal-window">
      <Content />
    </DocShell>
  );
}
