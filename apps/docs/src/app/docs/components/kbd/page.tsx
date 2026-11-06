import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/kbd.mdx";

export const metadata = docMetadata("kbd");

export default function KbdPage() {
  return (
    <DocShell slug="kbd">
      <Content />
    </DocShell>
  );
}
