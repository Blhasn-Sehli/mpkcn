import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/arch-diagram.mdx";

export const metadata = docMetadata("arch-diagram");

export default function ArchDiagramPage() {
  return (
    <DocShell slug="arch-diagram">
      <Content />
    </DocShell>
  );
}
