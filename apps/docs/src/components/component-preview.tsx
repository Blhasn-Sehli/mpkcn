import type { ReactNode } from "react";
import { readComponentSource } from "@/lib/registry-source";
import { CodeBlock } from "./code-block";
import { BootScreenDemo } from "./demos/boot-screen-demo";
import { RevealDemo } from "./demos/reveal-demo";
import { ThemeToggleDemo } from "./demos/theme-toggle-demo";
import { Tabs } from "./tabs";

const DEMOS: Record<string, () => ReactNode> = {
  "boot-screen": () => <BootScreenDemo />,
  "theme-toggle": () => <ThemeToggleDemo />,
  reveal: () => <RevealDemo />,
};

type ComponentPreviewProps = {
  /** Registry name, e.g. "boot-screen". */
  name: string;
  /** Custom preview; defaults to the component's standard demo. */
  children?: ReactNode;
  /** Code for the Code tab; defaults to the component source from src/registry. */
  code?: string;
  /** Language of `code`. */
  lang?: string;
  /** Remove the inner padding (for full-bleed demos like the boot screen). */
  flush?: boolean;
  /** Min height of the preview area in px. */
  minHeight?: number;
};

export function ComponentPreview({ name, children, code, lang = "tsx", flush, minHeight = 280 }: ComponentPreviewProps) {
  const source = code ?? readComponentSource(name);
  const preview = children ?? DEMOS[name]?.() ?? null;
  const isBoot = name === "boot-screen" && !children;
  const pad = flush ?? isBoot;

  return (
    <div className="not-prose my-8 min-w-0">
      <Tabs
        ariaLabel={`${name} preview`}
        listClassName="border-b border-mpk-line"
        items={[
          {
            label: "Preview",
            content: (
              <div
                className={`mpk-grid-bg mt-4 flex w-full items-center justify-center border border-mpk-line bg-mpk-bg ${pad ? "p-0" : "p-6 sm:p-10"}`}
                style={{ minHeight }}
              >
                <div className={`w-full ${pad ? "" : "max-w-xl"} flex justify-center`}>{preview}</div>
              </div>
            ),
          },
          {
            label: "Code",
            content: <CodeBlock code={source} lang={lang} title={code ? undefined : `${name}.tsx`} maxHeight={480} className="!mt-4 !mb-0" />,
          },
        ]}
      />
    </div>
  );
}
