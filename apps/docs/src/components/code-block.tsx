import { highlight } from "@/lib/highlight";
import { CopyButton } from "./copy-button";

const LABELS: Record<string, string> = {
  bash: "terminal",
  sh: "terminal",
  shell: "terminal",
  tsx: "tsx",
  ts: "ts",
  css: "css",
  json: "json",
};

type CodeBlockProps = {
  code: string;
  lang?: string;
  /** Shown in the bar above the code; defaults to the language. */
  title?: string;
  /** Hide the title bar (copy button floats top-right instead). */
  bare?: boolean;
  /** Cap the height and scroll inside (long sources). */
  maxHeight?: number;
  className?: string;
};

export async function CodeBlock({ code, lang, title, bare = false, maxHeight, className = "" }: CodeBlockProps) {
  const html = await highlight(code, lang);
  const label = title ?? (lang ? (LABELS[lang] ?? lang) : "text");
  const isTerminal = label === "terminal";

  return (
    <div className={`group relative my-6 min-w-0 border border-mpk-line bg-mpk-bg-soft ${className}`}>
      {!bare && (
        <div className="flex h-9 items-center justify-between border-b border-mpk-line pr-1 pl-4">
          <span className="flex items-center gap-2 font-mpk-mono text-[11px] text-mpk-dim">
            {isTerminal ? (
              <span aria-hidden="true" className="text-mpk-amber">
                $_
              </span>
            ) : (
              <span aria-hidden="true" className="size-1.5 bg-mpk-blue" />
            )}
            {label}
          </span>
          <CopyButton value={code.replace(/\n$/, "")} />
        </div>
      )}
      {bare && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <CopyButton value={code.replace(/\n$/, "")} />
        </div>
      )}
      <div
        className="overflow-x-auto py-4 [&_pre]:outline-none"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
        // Shiki output is generated at build time from our own sources.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
