import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/terminal-form.mdx";

export const metadata = docMetadata("terminal-form");

export default function TerminalFormPage() {
  return (
    <DocShell slug="terminal-form">
      <Content />
    </DocShell>
  );
}
