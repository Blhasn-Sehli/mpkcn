export { siteConfig } from "./site";

export type DocPage = {
  /** File name in src/content/docs (without .mdx) */
  slug: string;
  href: string;
  title: string;
  description: string;
  section: "Getting started" | "Components";
};

const pages: DocPage[] = [
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
    description: "Run npx mpkcn init, then npx mpkcn add <name>. The CLI writes the theme, wires your CSS and installs the packages.",
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
    description: "Use the mpkcn CLI to set up your project, add components and install what they need.",
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
    // The gallery lives outside /docs; listed first in the Components group.
    slug: "components-gallery",
    href: "/components/",
    title: "Browse all components",
    description: "Every component, running live, with its source and install command.",
    section: "Components",
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
  {
    slug: "ascii-image",
    href: "/docs/components/ascii-image/",
    title: "ASCII Image",
    description: "An image that starts as a wall of flickering code glyphs and decodes into the real picture in a left-to-right sweep.",
    section: "Components",
  },
  {
    slug: "back-to-top",
    href: "/docs/components/back-to-top/",
    title: "Back to Top",
    description: "A small square button that appears after the first screen and scrolls back up, with a reduced-motion jump and optional focus target.",
    section: "Components",
  },
  {
    slug: "command-palette",
    href: "/docs/components/command-palette/",
    title: "Command Palette",
    description: "A terminal-style Ctrl+K command palette with groups, fuzzy word filtering and full keyboard control, as a dialog or inline.",
    section: "Components",
  },
  {
    slug: "cursor",
    href: "/docs/components/cursor/",
    title: "Cursor",
    description: "A terminal-style pointer follower, a block caret with a trailing square ring and magnetic buttons, that steps aside for touch, text fields, the keyboard and reduced motion.",
    section: "Components",
  },
  {
    slug: "eyebrow",
    href: "/docs/components/eyebrow/",
    title: "Eyebrow",
    description: "A small mono label for above a heading that types itself out, with a block cursor, as it scrolls into view.",
    section: "Components",
  },
  {
    slug: "feature-list",
    href: "/docs/components/feature-list/",
    title: "Feature List",
    description: "A spec-sheet list of label and value rows between hairlines, sliding in one by one.",
    section: "Components",
  },
  {
    slug: "grain",
    href: "/docs/components/grain/",
    title: "Grain",
    description: "A static film-grain overlay in two blend layers that stays visible on both the dark and the light theme, at no per-frame cost.",
    section: "Components",
  },
  {
    slug: "image-placeholder",
    href: "/docs/components/image-placeholder/",
    title: "Image Placeholder",
    description: "A framed image slot that shows a striped placeholder with a mono label until the image exists or when it fails to load.",
    section: "Components",
  },
  {
    slug: "kbd",
    href: "/docs/components/kbd/",
    title: "Kbd",
    description: "A keyboard key badge with a thick bottom edge, for single keys or combos like Ctrl + K.",
    section: "Components",
  },
  {
    slug: "konami",
    href: "/docs/components/konami/",
    title: "Konami",
    description: "A useKonami hook and an easter-egg component that fires a callback and plays matrix rain when someone types the Konami code.",
    section: "Components",
  },
  {
    slug: "letter-reveal",
    href: "/docs/components/letter-reveal/",
    title: "Letter Reveal",
    description: "Splits a heading into letters that spring up and flip into place one after another.",
    section: "Components",
  },
  {
    slug: "scene-canvas",
    href: "/docs/components/scene-canvas/",
    title: "Scene Canvas",
    description: "A slow wave rippling through a grid of dots on a canvas, capped at 30fps and paused off screen, in hidden tabs, on weak devices and under reduced motion.",
    section: "Components",
  },
  {
    slug: "scroll-progress",
    href: "/docs/components/scroll-progress/",
    title: "Scroll Progress",
    description: "A thin accent bar that fills as the page or a scroll container is scrolled.",
    section: "Components",
  },
  {
    slug: "section-divider",
    href: "/docs/components/section-divider/",
    title: "Section Divider",
    description: "A terminal-style break between sections: hairlines grow out and a linked label types \"EOF about $ cd ../work\".",
    section: "Components",
  },
  {
    slug: "section-rail",
    href: "/docs/components/section-rail/",
    title: "Section Rail",
    description: "A slim side rail of numbered dots that tracks the section in view and jumps to a section on click.",
    section: "Components",
  },
  {
    slug: "shortcuts-dialog",
    href: "/docs/components/shortcuts-dialog/",
    title: "Shortcuts Dialog",
    description: "A keyboard-shortcut cheat sheet in a terminal-style dialog that opens with \"?\".",
    section: "Components",
  },
  {
    slug: "spotlight",
    href: "/docs/components/spotlight/",
    title: "Spotlight",
    description: "A panel with a soft accent glow that follows the pointer while it hovers, drawn in CSS without re-rendering.",
    section: "Components",
  },
  {
    slug: "terminal-form",
    href: "/docs/components/terminal-form/",
    title: "Terminal Form",
    description: "A form that runs like a terminal prompt: one question at a time, editable answers, then a confirm step that hands the values to your callback.",
    section: "Components",
  },
  {
    slug: "terminal-shell",
    href: "/docs/components/terminal-shell/",
    title: "Terminal Shell",
    description: "An interactive fake shell: you pass the commands, it handles the prompt, history, tab completion, help, clear and Ctrl+L.",
    section: "Components",
  },
  {
    slug: "terminal-window",
    href: "/docs/components/terminal-window/",
    title: "Terminal Window",
    description: "A terminal window with title bar and dots that types out commands and their output line by line, then shows your content.",
    section: "Components",
  },
  {
    slug: "tmux-bar",
    href: "/docs/components/tmux-bar/",
    title: "Tmux Bar",
    description: "A tmux-style status bar with a session block, clickable windows, custom segments, a clock, uptime and scroll position.",
    section: "Components",
  },
];

/** Getting started in written order; components A to Z, with the gallery link first. */
export const docs: DocPage[] = [
  ...pages.filter((p) => p.section !== "Components"),
  ...pages.filter((p) => p.slug === "components-gallery"),
  ...pages
    .filter((p) => p.section === "Components" && p.slug !== "components-gallery")
    .sort((a, b) => a.title.localeCompare(b.title)),
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
