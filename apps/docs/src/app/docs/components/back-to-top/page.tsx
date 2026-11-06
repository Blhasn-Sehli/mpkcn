import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/back-to-top.mdx";

export const metadata = docMetadata("back-to-top");

export default function BackToTopPage() {
  return (
    <DocShell slug="back-to-top">
      <Content />
    </DocShell>
  );
}
