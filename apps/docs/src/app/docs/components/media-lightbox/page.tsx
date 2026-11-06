import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/media-lightbox.mdx";

export const metadata = docMetadata("media-lightbox");

export default function MediaLightboxPage() {
  return (
    <DocShell slug="media-lightbox">
      <Content />
    </DocShell>
  );
}
