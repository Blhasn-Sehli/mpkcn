import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/cursor.mdx";

export const metadata = docMetadata("cursor");

export default function CursorPage() {
  return (
    <DocShell slug="cursor">
      <Content />
    </DocShell>
  );
}
