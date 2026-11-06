import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/eyebrow.mdx";

export const metadata = docMetadata("eyebrow");

export default function EyebrowPage() {
  return (
    <DocShell slug="eyebrow">
      <Content />
    </DocShell>
  );
}
