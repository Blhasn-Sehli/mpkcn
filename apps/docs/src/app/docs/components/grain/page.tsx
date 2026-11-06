import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/grain.mdx";

export const metadata = docMetadata("grain");

export default function GrainPage() {
  return (
    <DocShell slug="grain">
      <Content />
    </DocShell>
  );
}
