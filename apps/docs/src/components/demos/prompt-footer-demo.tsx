import { PromptFooter, type PromptFooterGroup, type PromptFooterProps } from "@/registry/prompt-footer";

const GROUPS: PromptFooterGroup[] = [
  {
    title: "sections",
    links: [
      { label: "docs", href: "#docs" },
      { label: "blog", href: "#blog" },
      { label: "changelog", href: "#changelog" },
    ],
  },
  {
    title: "elsewhere",
    links: [
      { label: "github", href: "https://github.com" },
      { label: "rss", href: "#rss" },
    ],
  },
];

/** A PromptFooter at the bottom of a framed box: link columns, a now block, the copyright and a live clock. */
export function PromptFooterDemo({ compact = false, ...props }: Partial<PromptFooterProps> & { compact?: boolean }) {
  return (
    <div className="w-full overflow-hidden border border-mpk-line">
      <PromptFooter
        user="guest"
        host="mysite.dev"
        groups={compact ? GROUPS.slice(0, 1) : GROUPS}
        now={compact ? undefined : [
          { label: "building", value: "a terminal UI kit" },
          { label: "reading", value: "the Next.js 16 docs" },
        ]}
        owner="Your Name"
        note={compact ? undefined : "built with Next.js & Tailwind"}
        clock={!compact}
        backToTop={!compact}
        className={compact ? "py-5" : undefined}
        {...props}
      />
    </div>
  );
}
