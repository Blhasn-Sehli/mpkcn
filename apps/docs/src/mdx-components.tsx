import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { ComponentPreview } from "@/components/component-preview";
import { BootScreenDemo } from "@/components/demos/boot-screen-demo";
import { RevealDemo } from "@/components/demos/reveal-demo";
import { ThemeToggleDemo } from "@/components/demos/theme-toggle-demo";
import { InstallTabs } from "@/components/install-tabs";
import { Callout, PropsTable, Steps } from "@/components/mdx-parts";
import { TokenTable } from "@/components/token-table";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function Anchor({ id }: { id?: string }) {
  if (!id) return null;
  return (
    <a
      href={`#${id}`}
      aria-hidden="true"
      tabIndex={-1}
      className="ml-2 font-mpk-mono text-[0.8em] font-normal text-mpk-dim2 no-underline opacity-0 transition-opacity group-hover:opacity-100 hover:text-mpk-amber"
    >
      #
    </a>
  );
}

const components: MDXComponents = {
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="group mt-14 mb-4 scroll-mt-24 border-b border-mpk-line pb-2 text-[1.45rem] font-semibold tracking-tight text-mpk-ink first:mt-0"
    >
      {children}
      <Anchor id={id} />
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="group mt-10 mb-3 scroll-mt-24 text-lg font-semibold tracking-tight text-mpk-ink">
      {children}
      <Anchor id={id} />
    </h3>
  ),
  h4: ({ children, id }) => (
    <h4 id={id} className="mt-8 mb-2 scroll-mt-24 font-mpk-mono text-sm font-medium text-mpk-ink">
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="my-4 leading-7 text-mpk-dim [&_strong]:text-mpk-ink">{children}</p>,
  a: ({ href = "", children }) => {
    const cls = "font-medium text-mpk-blue underline decoration-mpk-blue/30 underline-offset-4 hover:decoration-mpk-blue";
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    }
    if (href.startsWith("#")) {
      return (
        <a href={href} className={cls}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="my-4 ml-1 flex flex-col gap-2 text-mpk-dim [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:font-mpk-mono [&>li]:before:text-mpk-amber [&>li]:before:content-['-']">
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="my-4 ml-5 flex list-decimal flex-col gap-2 text-mpk-dim marker:font-mpk-mono marker:text-mpk-dim2">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-mpk-ink">{children}</strong>,
  hr: () => <hr className="my-10 border-mpk-line" />,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-mpk-amber pl-4 text-mpk-dim italic">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="border border-mpk-line bg-mpk-bg-soft px-1.5 py-px font-mpk-mono text-[0.84em] text-mpk-ink">{children}</code>
  ),
  pre: ({ children }) => {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    const lang = /language-(\S+)/.exec(child?.props?.className ?? "")?.[1];
    return <CodeBlock code={textOf(child?.props?.children)} lang={lang} />;
  },
  table: ({ children }) => (
    <div className="my-6 w-full overflow-x-auto border border-mpk-line">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-mpk-line bg-mpk-bg-soft">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-mpk-line last:border-b-0">{children}</tr>,
  th: ({ children, style }: ComponentProps<"th">) => (
    <th style={style} className="px-4 py-2.5 font-mpk-mono text-[11px] font-medium tracking-wide whitespace-nowrap text-mpk-dim uppercase">
      {children}
    </th>
  ),
  td: ({ children, style }: ComponentProps<"td">) => (
    <td style={style} className="px-4 py-3 align-top leading-relaxed text-mpk-dim [&_code]:whitespace-nowrap">
      {children}
    </td>
  ),
  // Docs building blocks, usable in MDX without imports.
  ComponentPreview,
  InstallTabs,
  PropsTable,
  Callout,
  Steps,
  TokenTable,
  CodeBlock,
  BootScreenDemo,
  ThemeToggleDemo,
  RevealDemo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
