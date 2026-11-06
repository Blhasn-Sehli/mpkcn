import Link from "next/link";
import { getRegistryItem } from "@/registry";
import { readRegistryFile } from "@/lib/registry-source";
import { testedVersions } from "@/lib/site";
import { CodeBlock } from "./code-block";
import { Tabs } from "./tabs";

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="mt-6 flex items-center gap-3 text-sm font-medium text-mpk-ink first:mt-4">
      <span className="inline-grid size-6 place-items-center border border-mpk-line font-mpk-mono text-[10px] text-mpk-amber">
        {String(n).padStart(2, "0")}
      </span>
      {children}
    </p>
  );
}

export function InstallTabs({ name }: { name: string }) {
  const item = getRegistryItem(name);
  const deps = item?.dependencies ?? [];
  const files = item?.files ?? [{ path: `${name}.tsx`, target: `${name}.tsx` }];
  let step = 0;

  return (
    <div className="not-prose my-6 min-w-0">
      <Tabs
        ariaLabel={`Install ${name}`}
        listClassName="border-b border-mpk-line"
        items={[
          {
            label: "CLI",
            content: <CodeBlock code={`npx mpkcn add ${name}`} lang="bash" className="!mt-4 !mb-0" />,
          },
          {
            label: "Manual",
            content: (
              <div className="pt-1">
                {deps.length > 0 && (
                  <>
                    <StepTitle n={++step}>Install the dependencies</StepTitle>
                    <CodeBlock code={`npm i ${deps.join(" ")}`} lang="bash" className="!mt-3 !mb-0" />
                  </>
                )}
                <StepTitle n={++step}>
                  <span>
                    Add <code className="font-mpk-mono text-[13px] text-mpk-amber">mpkcn-theme.css</code> if you haven&apos;t
                    yet (see{" "}
                    <Link href="/docs/installation/" className="text-mpk-blue underline-offset-4 hover:underline">
                      Installation
                    </Link>
                    )
                  </span>
                </StepTitle>
                <StepTitle n={++step}>Copy the source into your components folder</StepTitle>
                {files.map((f) => (
                  <CodeBlock
                    key={f.target}
                    code={readRegistryFile(f.path)}
                    lang={f.path.endsWith(".css") ? "css" : f.path.endsWith(".ts") ? "ts" : "tsx"}
                    title={`components/${f.target}`}
                    maxHeight={360}
                    className="!mt-3 !mb-3"
                  />
                ))}
                <StepTitle n={++step}>Update the import paths to match your project</StepTitle>
              </div>
            ),
          },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mpk-mono text-xs text-mpk-dim">
        <span className="text-mpk-dim2">deps:</span>
        {deps.length === 0 ? (
          <span>none beyond react</span>
        ) : (
          deps.map((d) => (
            <span key={d} className="border border-mpk-line px-2 py-0.5">
              <span className="text-mpk-ink">{d}</span>
              {testedVersions[d] && <span className="text-mpk-dim2">@{testedVersions[d]}</span>}
            </span>
          ))
        )}
        <span className="text-mpk-dim2">· tested with react@{testedVersions.react}</span>
      </div>
    </div>
  );
}
