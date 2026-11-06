import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/theming.mdx";

export const metadata = docMetadata("theming");

export default function ThemingPage() {
  return (
    <DocShell slug="theming">
      <Content />
    </DocShell>
  );
}
