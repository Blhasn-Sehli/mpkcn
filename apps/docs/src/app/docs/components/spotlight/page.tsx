import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/spotlight.mdx";

export const metadata = docMetadata("spotlight");

export default function SpotlightPage() {
  return (
    <DocShell slug="spotlight">
      <Content />
    </DocShell>
  );
}
