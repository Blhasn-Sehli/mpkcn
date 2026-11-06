import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/introduction.mdx";

export const metadata = docMetadata("introduction");

export default function IntroductionPage() {
  return (
    <DocShell slug="introduction">
      <Content />
    </DocShell>
  );
}
