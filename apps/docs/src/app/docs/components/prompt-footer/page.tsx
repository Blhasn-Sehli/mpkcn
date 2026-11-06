import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/prompt-footer.mdx";

export const metadata = docMetadata("prompt-footer");

export default function PromptFooterPage() {
  return (
    <DocShell slug="prompt-footer">
      <Content />
    </DocShell>
  );
}
