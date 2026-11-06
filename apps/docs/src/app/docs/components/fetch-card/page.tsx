import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/fetch-card.mdx";

export const metadata = docMetadata("fetch-card");

export default function FetchCardPage() {
  return (
    <DocShell slug="fetch-card">
      <Content />
    </DocShell>
  );
}
