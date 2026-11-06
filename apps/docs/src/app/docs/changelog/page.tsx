import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/changelog.mdx";

export const metadata = docMetadata("changelog");

export default function ChangelogPage() {
  return (
    <DocShell slug="changelog">
      <Content />
    </DocShell>
  );
}
