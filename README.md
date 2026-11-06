<div align="center">

# mpkcn

**Terminal-style React components you copy, paste and own.**

[Docs](https://blhasn-sehli.github.io/mpkcn/) · [Components](https://blhasn-sehli.github.io/mpkcn/docs/components/boot-screen/) · [Changelog](https://blhasn-sehli.github.io/mpkcn/docs/changelog/)

[![CI](https://github.com/Blhasn-Sehli/mpkcn/actions/workflows/ci.yml/badge.svg)](https://github.com/Blhasn-Sehli/mpkcn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-e8a33d.svg)](LICENSE)

</div>

- **Copy, don't install.** `npx mpkcn add boot-screen` writes the source into your project. You own it and can edit it.
- **One look.** Square corners, hairline borders, no shadows, amber and blue on a dark terminal palette, with a light theme too.
- **Accessible by default.** Keyboard support, labelled controls, and `prefers-reduced-motion` respected everywhere.
- **Themeable.** Eight CSS variables drive every component, exposed as Tailwind 4 utilities (`bg-mpk-bg`, `text-mpk-blue`, …).

## Components

| Component | What it does |
| --- | --- |
| [Boot Screen](https://blhasn-sehli.github.io/mpkcn/docs/components/boot-screen/) | A login-style intro that types itself out, rains a little matrix and gets out of the way. |
| [Theme Toggle](https://blhasn-sehli.github.io/mpkcn/docs/components/theme-toggle/) | Dark/light switch for next-themes, as an icon or a `--dark` flag. |
| [Reveal](https://blhasn-sehli.github.io/mpkcn/docs/components/reveal/) | Fades and slides content in as it scrolls into view. |

## Quick start

```bash
npx mpkcn add boot-screen
```

Then import the theme once in your global CSS and use the component. Full guide: [Installation](https://blhasn-sehli.github.io/mpkcn/docs/installation/).

**Requirements:** React 19, Next.js 15+ (16 recommended), Tailwind CSS 4, Node.js 22+ for the CLI.

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
