import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/theme-toggle.mdx";

export const metadata = docMetadata("theme-toggle");

export default function ThemeTogglePage() {
  return (
    <DocShell slug="theme-toggle">
      <Content />
    </DocShell>
  );
}
