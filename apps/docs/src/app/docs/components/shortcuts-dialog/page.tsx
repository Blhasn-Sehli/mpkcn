import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/shortcuts-dialog.mdx";

export const metadata = docMetadata("shortcuts-dialog");

export default function ShortcutsDialogPage() {
  return (
    <DocShell slug="shortcuts-dialog">
      <Content />
    </DocShell>
  );
}
