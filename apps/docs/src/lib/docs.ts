export { siteConfig } from "./site";

export type DocPage = {
  /** File name in src/content/docs (without .mdx) */
  slug: string;
  href: string;
  title: string;
  description: string;
  section: "Getting started" | "Components";
};

export const docs: DocPage[] = [
  {
    slug: "introduction",
    href: "/docs/",
    title: "Introduction",
    description:
      "A terminal-flavoured React UI kit you install by copying source, not by adding a package.",
    section: "Getting started",
  },
  {
    slug: "installation",
    href: "/docs/installation/",
    title: "Installation",
    description: "Set up Tailwind 4, next-themes and the mpkcn tokens, then add your first component.",
    section: "Getting started",
  },
  {
    slug: "theming",
    href: "/docs/theming/",
    title: "Theming",
    description: "Eight CSS variables drive every component. Here is each one, in both themes.",
    section: "Getting started",
  },
  {
    slug: "cli",
    href: "/docs/cli/",
    title: "CLI",
    description: "Use the mpkcn CLI to list components and copy them into your project.",
    section: "Getting started",
  },
  {
    slug: "changelog",
    href: "/docs/changelog/",
    title: "Changelog",
    description: "What shipped in each mpkcn release.",
    section: "Getting started",
  },
  {
    slug: "boot-screen",
    href: "/docs/components/boot-screen/",
    title: "Boot Screen",
    description:
      "A tuigreet-style login screen that types itself out, rains a little matrix and gets out of the way.",
    section: "Components",
  },
  {
    slug: "theme-toggle",
    href: "/docs/components/theme-toggle/",
    title: "Theme Toggle",
    description: "A dark / light switch for next-themes, as an icon or as a terminal flag.",
    section: "Components",
  },
  {
    slug: "reveal",
    href: "/docs/components/reveal/",
    title: "Reveal",
    description: "Fade and slide content in as it scrolls into view. Stays still under reduced motion.",
    section: "Components",
  },
];

export const docSections = ["Getting started", "Components"] as const;

export function getDoc(slug: string): DocPage {
  const doc = docs.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Unknown doc page: ${slug}`);
  return doc;
}

export function getPager(slug: string) {
  const i = docs.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? docs[i - 1] : undefined, next: i < docs.length - 1 ? docs[i + 1] : undefined };
}

/** Strips the trailing slash so hrefs compare against usePathname(). */
export function normalizePath(path: string) {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}
