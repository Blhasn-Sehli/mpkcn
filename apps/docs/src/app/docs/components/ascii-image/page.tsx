import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/ascii-image.mdx";

export const metadata = docMetadata("ascii-image");

export default function AsciiImagePage() {
  return (
    <DocShell slug="ascii-image">
      <Content />
    </DocShell>
  );
}
