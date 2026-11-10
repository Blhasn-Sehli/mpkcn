/** Current mpkcn release. Keep in sync with packages/cli/package.json. */
export const version = "0.4.0";

export const siteConfig = {
  name: "mpkcn",
  version,
  url: "https://blhasn-sehli.github.io/mpkcn",
  github: "https://github.com/Blhasn-Sehli/mpkcn",
  description:
    "Terminal-style React components you copy, paste and own. 35 components (boot screens, command palettes, file explorers, tmux bars), set up with one command or by asking your AI assistant.",
};

/** npm packages the components depend on, with the version the docs and registry are tested with. */
export const testedVersions: Record<string, string> = {
  react: "19.3.0",
  next: "16.4.5",
  tailwindcss: "4.x",
  "next-themes": "0.4.6",
  "framer-motion": "13.4.4",
  typescript: "5.x",
};
