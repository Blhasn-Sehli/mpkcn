import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/scroll-progress.mdx";

export const metadata = docMetadata("scroll-progress");

export default function ScrollProgressPage() {
  return (
    <DocShell slug="scroll-progress">
      <Content />
    </DocShell>
  );
}
