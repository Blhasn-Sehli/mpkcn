import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/reveal.mdx";

export const metadata = docMetadata("reveal");

export default function RevealPage() {
  return (
    <DocShell slug="reveal">
      <Content />
    </DocShell>
  );
}
