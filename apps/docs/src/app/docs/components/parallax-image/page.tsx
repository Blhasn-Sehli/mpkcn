import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/parallax-image.mdx";

export const metadata = docMetadata("parallax-image");

export default function ParallaxImagePage() {
  return (
    <DocShell slug="parallax-image">
      <Content />
    </DocShell>
  );
}
