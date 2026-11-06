import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/tech-stack.mdx";

export const metadata = docMetadata("tech-stack");

export default function TechStackPage() {
  return (
    <DocShell slug="tech-stack">
      <Content />
    </DocShell>
  );
}
