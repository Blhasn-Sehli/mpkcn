import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/konami.mdx";

export const metadata = docMetadata("konami");

export default function KonamiPage() {
  return (
    <DocShell slug="konami">
      <Content />
    </DocShell>
  );
}
