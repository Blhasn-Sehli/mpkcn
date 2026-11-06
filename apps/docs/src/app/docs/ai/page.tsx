import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/ai.mdx";

export const metadata = docMetadata("ai");

export default function AiPage() {
  return (
    <DocShell slug="ai">
      <Content />
    </DocShell>
  );
}
