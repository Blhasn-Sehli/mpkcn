# mpkcn

The CLI for [mpkcn](https://blhasn-sehli.github.io/mpkcn), a terminal-style React UI kit. Like shadcn, it copies component source into your project, so you own the code.

```bash
npx mpkcn add boot-screen
```

This writes `boot-screen.tsx`, its helpers and the shared `mpkcn-theme.css` to `src/components/mpkcn` (or `components/mpkcn` when there is no `src/` folder), then prints the npm packages to install with your package manager.

Import the theme once in your global CSS:

```css
@import "./components/mpkcn/mpkcn-theme.css";
```

## Commands

| Command | What it does |
| --- | --- |
| `mpkcn add <name...>` | Add one or more components and everything they depend on. |
| `mpkcn list` | Show the available components. |
| `mpkcn --help` | Show usage. |
| `mpkcn --version` | Show the version. |

## Options

| Option | Description |
| --- | --- |
| `-d, --dir <path>` | Target folder. Default: `src/components/mpkcn`, or `components/mpkcn`. |
| `-r, --registry <url>` | Registry URL or local folder. Default: `https://blhasn-sehli.github.io/mpkcn/r`. |
| `-o, --overwrite` | Replace files that already exist (they are skipped by default). |
| `-y, --yes` | Non-interactive. mpkcn never prompts; accepted for scripts. |

## Safety

Item names must match `[a-z0-9-]+`, and every file target is checked before anything is written: absolute paths and paths that leave the target folder are rejected.

## Requirements

Node.js 22 or newer (current LTS). No runtime dependencies.

## Docs

Component previews and props: https://blhasn-sehli.github.io/mpkcn

## License

MIT
