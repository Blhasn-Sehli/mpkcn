import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/file-explorer.mdx";

export const metadata = docMetadata("file-explorer");

export default function FileExplorerPage() {
  return (
    <DocShell slug="file-explorer">
      <Content />
    </DocShell>
  );
}
