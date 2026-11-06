import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/env-card.mdx";

export const metadata = docMetadata("env-card");

export default function EnvCardPage() {
  return (
    <DocShell slug="env-card">
      <Content />
    </DocShell>
  );
}
