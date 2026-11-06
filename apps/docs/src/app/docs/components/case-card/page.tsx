import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/case-card.mdx";

export const metadata = docMetadata("case-card");

export default function CaseCardPage() {
  return (
    <DocShell slug="case-card">
      <Content />
    </DocShell>
  );
}
