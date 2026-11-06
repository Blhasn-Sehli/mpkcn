import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/site-header.mdx";

export const metadata = docMetadata("site-header");

export default function SiteHeaderPage() {
  return (
    <DocShell slug="site-header">
      <Content />
    </DocShell>
  );
}
