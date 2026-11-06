# mpkcn

The CLI for [mpkcn](https://blhasn-sehli.github.io/mpkcn), a terminal-style React UI kit. Like shadcn, it copies component source into your project, so you own the code.

```bash
npx mpkcn add theme-toggle
```

That is the whole setup. In a Next.js app, one command:

- writes the component, `mpkcn-theme.css` and the theme provider to `src/components/mpkcn` (or `components/mpkcn` when there is no `src/` folder);
- imports the theme in your global CSS, right after `@import "tailwindcss"`;
- loads Space Grotesk and JetBrains Mono with `next/font` and wraps `{children}` in the theme provider, in your root layout;
- installs the npm packages with your package manager, and prints the import to paste.

```txt
$ npx mpkcn add theme-toggle
Adding theme-toggle (+ theme, theme-provider)
  created     src/components/mpkcn/mpkcn-theme.css
  created     src/components/mpkcn/theme-provider.tsx
  created     src/components/mpkcn/theme-toggle.tsx
  updated     src/app/globals.css  (+ @import "../components/mpkcn/mpkcn-theme.css";)
  updated     src/app/layout.tsx  (+ fonts, theme provider)

Installing dependencies
  npm install next-themes

Done. Use it:
  import { ThemeToggle } from "@/components/mpkcn/theme-toggle";
```

`npx mpkcn init` runs the same setup without a component, and checks your project.

## Commands

| Command | What it does |
| --- | --- |
| `mpkcn init` | Set up the theme, fonts and theme provider, check the prerequisites. |
| `mpkcn add <name...>` | Add components and everything they depend on, then install their npm packages. |
| `mpkcn list` | Show the available components. |
| `mpkcn mcp` | Run the MCP server for AI assistants (see below). |
| `mpkcn --help` | Show usage. |
| `mpkcn --version` | Show the version. |

## Options

| Option | Description |
| --- | --- |
| `-d, --dir <path>` | Target folder. Default: `src/components/mpkcn`, or `components/mpkcn`. |
| `-c, --css <path>` | Global CSS file for the theme `@import`. Default: auto-detected. |
| `-r, --registry <url>` | Registry URL or local folder. Default: `$MPKCN_REGISTRY`, else `https://blhasn-sehli.github.io/mpkcn/r`. |
| `-o, --overwrite` | Replace files that already exist (they are skipped by default). |
| `--no-install` | Do not install npm packages, only print the command. |
| `--no-layout` | Never edit the root layout; print the lines to add instead. |
| `--no-fonts` | Do not load the fonts. |
| `-y, --yes` | Non-interactive. mpkcn never prompts; accepted for scripts. |

## Use with AI

`mpkcn mcp` is a Model Context Protocol server, so Claude Code, Cursor, VS Code, Windsurf or Claude Desktop can find components and add them for you: "add a terminal boot screen to my landing page", "which mpkcn component fits a status bar?".

Claude Code:

```bash
claude mcp add mpkcn -- npx -y mpkcn@latest mcp
```

Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`, which uses `"servers"` instead of `"mcpServers"`):

```json
{
  "mcpServers": {
    "mpkcn": { "type": "stdio", "command": "npx", "args": ["-y", "mpkcn@latest", "mcp"] }
  }
}
```

`npx mpkcn mcp --help` prints the snippets for every assistant.

| Tool | What it does |
| --- | --- |
| `list_components` | Search the components: name, title, description, category, dependencies. |
| `get_component` | Full source, npm and registry dependencies, import line, usage example, docs URL. |
| `add_components` | Same as `mpkcn add` in the project folder (`cwd`), with `overwrite`, `install`, `layout` and `dir`. Returns the files, installed packages, import lines and warnings. |
| `init_project` | Same as `mpkcn init`. Returns the files and the project checks. |

Only `add_components` and `init_project` write files or run your package manager, and only in a folder that has a `package.json`. The server speaks newline-delimited JSON-RPC on stdin / stdout and logs to stderr; it adds no runtime dependency to the CLI. Use `--registry <url>` or `MPKCN_REGISTRY` for a custom registry. Guide: https://blhasn-sehli.github.io/mpkcn/docs/ai/

## How it finds things

- **Package manager:** the `packageManager` field of `package.json`, then the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`), npm otherwise. Packages already in `package.json` are not installed again. If the install fails, the command is printed and mpkcn exits with code 1.
- **Global CSS:** `src/app/globals.css`, `app/globals.css`, `src/styles/globals.css`, `src/index.css` and other common paths, then any CSS file that has `@import "tailwindcss"`. The theme import is added once and never duplicated. If no file is found, mpkcn prints the line to add.
- **Root layout:** `src/app/layout.tsx` or `app/layout.tsx`, edited only when `next` is a dependency and the layout has the simple `create-next-app` shape. A layout that already has a `ThemeProvider` or the fonts is left alone; anything unusual gets the exact lines to paste. Running mpkcn again never adds anything twice. Without Next.js, mpkcn prints the provider usage and a Google Fonts `@import` line instead of editing.
- **Import path:** `@/…` when `tsconfig.json` (or `jsconfig.json`) maps `@/*`, otherwise a path from the project root.

## Safety

Item names must match `[a-z0-9-]+`, and every file target is checked before anything is written: absolute paths and paths that leave the target folder are rejected. npm package names from the registry are validated before they reach your package manager.

## Requirements

Node.js 22 or newer (current LTS). No runtime dependencies.

## Docs

Component previews and props: https://blhasn-sehli.github.io/mpkcn

## License

MIT
