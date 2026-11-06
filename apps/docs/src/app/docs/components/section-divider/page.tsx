import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/section-divider.mdx";

export const metadata = docMetadata("section-divider");

export default function SectionDividerPage() {
  return (
    <DocShell slug="section-divider">
      <Content />
    </DocShell>
  );
}
