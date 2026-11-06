import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/feature-list.mdx";

export const metadata = docMetadata("feature-list");

export default function FeatureListPage() {
  return (
    <DocShell slug="feature-list">
      <Content />
    </DocShell>
  );
}
