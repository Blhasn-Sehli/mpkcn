import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/command-palette.mdx";

export const metadata = docMetadata("command-palette");

export default function CommandPalettePage() {
  return (
    <DocShell slug="command-palette">
      <Content />
    </DocShell>
  );
}
