<div align="center">

# mpkcn

**Terminal-style React components you copy, paste and own.**

[Docs](https://blhasn-sehli.github.io/mpkcn/) · [Gallery](https://blhasn-sehli.github.io/mpkcn/components/) · [Changelog](https://blhasn-sehli.github.io/mpkcn/docs/changelog/)

[![CI](https://github.com/Blhasn-Sehli/mpkcn/actions/workflows/ci.yml/badge.svg)](https://github.com/Blhasn-Sehli/mpkcn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-e8a33d.svg)](LICENSE)

</div>

- **Copy, don't install.** `npx mpkcn add boot-screen` writes the source into your project. You own it and can edit it.
- **One look.** Square corners, hairline borders, no shadows, amber and blue on a dark terminal palette, with a light theme too.
- **Accessible by default.** Keyboard support, labelled controls, and `prefers-reduced-motion` respected everywhere.
- **Themeable.** Eight CSS variables drive every component, exposed as Tailwind 4 utilities (`bg-mpk-bg`, `text-mpk-blue`, …).

## Components

35 components, all running live in the **[gallery](https://blhasn-sehli.github.io/mpkcn/components/)**:

| Group | Components |
| --- | --- |
| Intro & theme | boot-screen, theme-toggle |
| Terminal | terminal-window, terminal-shell, command-palette, shortcuts-dialog, tmux-bar, terminal-form, konami, fetch-card, env-card |
| Navigation | site-header, prompt-footer, file-explorer, scroll-hint |
| Cards & media | case-card, tech-stack, arch-diagram, media-lightbox, parallax-image |
| Effects | cursor, grain, spotlight, scene-canvas, ascii-image, letter-reveal, reveal |
| Text & layout | kbd, eyebrow, section-divider, section-rail, image-placeholder, feature-list, scroll-progress, back-to-top |

## Quick start

```bash
npx mpkcn add theme-toggle
```

That is the whole setup. In a Next.js app, the first command writes the component, the theme and the theme provider, imports the theme in your global CSS, loads Space Grotesk and JetBrains Mono with `next/font`, wraps your root layout in the provider, and installs `next-themes`. Then import the component and use it. Full guide: [Installation](https://blhasn-sehli.github.io/mpkcn/docs/installation/).

**Requirements:** React 19, Next.js 15+ (16 recommended), Tailwind CSS 4, Node.js 22+ for the CLI.

## Use with AI

Let your assistant add components for you. The CLI is also an MCP server:

```bash
claude mcp add mpkcn -- npx -y mpkcn@latest mcp
```

Then ask "add a terminal boot screen to my landing page". Cursor, VS Code, Windsurf and Claude Desktop configs: [Use with AI](https://blhasn-sehli.github.io/mpkcn/docs/ai/). The docs are also published as [llms.txt](https://blhasn-sehli.github.io/mpkcn/llms.txt) and [llms-full.txt](https://blhasn-sehli.github.io/mpkcn/llms-full.txt).

## Repository

| Path | Contents |
| --- | --- |
| `apps/docs` | The docs site (Next.js 16, MDX, static export) and the component registry in `src/registry`. |
| `packages/cli` | The `mpkcn` CLI, zero runtime dependencies. |
| `docs/ARCHITECTURE.md` | Tokens, registry format and CLI contract. |

```bash
pnpm install
pnpm dev     # docs site on http://localhost:3000
pnpm test    # CLI tests
pnpm build   # CLI + static docs
```

## License

[MIT](LICENSE) © Bellhassen Sehli
