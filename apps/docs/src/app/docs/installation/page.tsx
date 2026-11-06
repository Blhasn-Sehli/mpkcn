import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/installation.mdx";

export const metadata = docMetadata("installation");

export default function InstallationPage() {
  return (
    <DocShell slug="installation">
      <Content />
    </DocShell>
  );
}
