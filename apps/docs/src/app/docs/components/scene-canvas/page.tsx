import { DocShell, docMetadata } from "@/components/doc-shell";
import Content from "@/content/docs/scene-canvas.mdx";

export const metadata = docMetadata("scene-canvas");

export default function SceneCanvasPage() {
  return (
    <DocShell slug="scene-canvas">
      <Content />
    </DocShell>
  );
}
