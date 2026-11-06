import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/cli.mdx";

export const metadata = docMetadata("cli");

export default function CliPage() {
  return (
    <DocShell slug="cli">
      <Content />
    </DocShell>
  );
}
