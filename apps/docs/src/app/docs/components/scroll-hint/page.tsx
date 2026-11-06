import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/scroll-hint.mdx";

export const metadata = docMetadata("scroll-hint");

export default function ScrollHintPage() {
  return (
    <DocShell slug="scroll-hint">
      <Content />
    </DocShell>
  );
}
