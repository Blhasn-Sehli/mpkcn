import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/letter-reveal.mdx";

export const metadata = docMetadata("letter-reveal");

export default function LetterRevealPage() {
  return (
    <DocShell slug="letter-reveal">
      <Content />
    </DocShell>
  );
}
