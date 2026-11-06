# mpkcn

The CLI for [mpkcn](https://blhasn-sehli.github.io/mpkcn), a terminal-style React UI kit. Like shadcn, it copies component source into your project, so you own the code.

```bash
npx mpkcn init
npx mpkcn add boot-screen
```

That is the whole setup:

- `init` writes `mpkcn-theme.css`, adds its `@import` to your global CSS (right after `@import "tailwindcss"`), and checks for React 19, Tailwind CSS 4 and next-themes.
- `add` writes the component to `src/components/mpkcn` (or `components/mpkcn` when there is no `src/` folder), installs its npm packages with your package manager, and prints the import to paste.

```txt
$ npx mpkcn add boot-screen
Adding boot-screen (+ theme)
  created     src/components/mpkcn/mpkcn-theme.css
  created     src/components/mpkcn/boot-screen.tsx
  created     src/components/mpkcn/lib/matrix-rain.ts
  updated     src/app/globals.css  (+ @import "../components/mpkcn/mpkcn-theme.css";)

Done. Use it:
  import { BootScreen } from "@/components/mpkcn/boot-screen";
```

`init` is optional: the first `add` runs the same setup.

## Commands

| Command | What it does |
| --- | --- |
| `mpkcn init` | Write the theme, import it in your global CSS, check the prerequisites. |
| `mpkcn add <name...>` | Add components and everything they depend on, then install their npm packages. |
| `mpkcn list` | Show the available components. |
| `mpkcn --help` | Show usage. |
| `mpkcn --version` | Show the version. |

## Options

| Option | Description |
| --- | --- |
| `-d, --dir <path>` | Target folder. Default: `src/components/mpkcn`, or `components/mpkcn`. |
| `-c, --css <path>` | Global CSS file for the theme `@import`. Default: auto-detected. |
| `-r, --registry <url>` | Registry URL or local folder. Default: `https://blhasn-sehli.github.io/mpkcn/r`. |
| `-o, --overwrite` | Replace files that already exist (they are skipped by default). |
| `--no-install` | Do not install npm packages, only print the command. |
| `-y, --yes` | Non-interactive. mpkcn never prompts; accepted for scripts. |

## How it finds things

- **Package manager:** the `packageManager` field of `package.json`, then the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`), npm otherwise. Packages already in `package.json` are not installed again. If the install fails, the command is printed and mpkcn exits with code 1.
- **Global CSS:** `src/app/globals.css`, `app/globals.css`, `src/styles/globals.css`, `src/index.css` and other common paths, then any CSS file that has `@import "tailwindcss"`. The theme import is added once and never duplicated. If no file is found, mpkcn prints the line to add.
- **Import path:** `@/…` when `tsconfig.json` (or `jsconfig.json`) maps `@/*`, otherwise a path from the project root.

## Safety

Item names must match `[a-z0-9-]+`, and every file target is checked before anything is written: absolute paths and paths that leave the target folder are rejected. npm package names from the registry are validated before they reach your package manager.

## Requirements

Node.js 22 or newer (current LTS). No runtime dependencies.

## Docs

Component previews and props: https://blhasn-sehli.github.io/mpkcn

## License

MIT
