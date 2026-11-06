import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/boot-screen.mdx";

export const metadata = docMetadata("boot-screen");

export default function BootScreenPage() {
  return (
    <DocShell slug="boot-screen">
      <Content />
    </DocShell>
  );
}
