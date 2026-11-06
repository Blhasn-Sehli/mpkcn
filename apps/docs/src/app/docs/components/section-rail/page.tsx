import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/section-rail.mdx";

export const metadata = docMetadata("section-rail");

export default function SectionRailPage() {
  return (
    <DocShell slug="section-rail">
      <Content />
    </DocShell>
  );
}
