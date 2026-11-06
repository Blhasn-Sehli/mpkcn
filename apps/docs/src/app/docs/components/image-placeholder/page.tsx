import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/image-placeholder.mdx";

export const metadata = docMetadata("image-placeholder");

export default function ImagePlaceholderPage() {
  return (
    <DocShell slug="image-placeholder">
      <Content />
    </DocShell>
  );
}
