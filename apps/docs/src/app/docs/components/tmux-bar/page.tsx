import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/tmux-bar.mdx";

export const metadata = docMetadata("tmux-bar");

export default function TmuxBarPage() {
  return (
    <DocShell slug="tmux-bar">
      <Content />
    </DocShell>
  );
}
