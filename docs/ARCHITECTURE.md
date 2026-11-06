# mpkcn architecture

How the kit is put together: tokens, components, registry format and CLI contract.

mpkcn is a terminal-style React UI kit, distributed shadcn-style: `npx mpkcn add boot-screen` copies a component's source into the user's project. Design source: MpK's portfolio (dark default, amber + blue accents, square corners, hairline borders, no box shadows, Space Grotesk + JetBrains Mono).

Stack: pnpm workspace. `apps/docs` = Next.js 16.4 (App Router, Tailwind 4, React 19.3, `src/` dir, alias `@/*` → `src/*`). `packages/cli` = the `mpkcn` CLI. **Next.js 16 differs from older versions: read the guide in `apps/docs/node_modules/next/dist/docs/` before using a feature.**

## 1. Theme tokens (`apps/docs/src/registry/mpkcn-theme.css`)

```css
:root, .dark {
  --mpk-bg: #0a0d10; --mpk-bg-soft: #10151a; --mpk-line: #1f2b34; --mpk-ink: #eef2f4;
  --mpk-dim: #7c8fa0; --mpk-dim2: #47555f; --mpk-amber: #e8a33d; --mpk-blue: #6fb2ff;
}
.light {
  --mpk-bg: oklch(0.975 0.006 240); --mpk-bg-soft: oklch(0.945 0.011 240); --mpk-line: oklch(0.86 0.014 240);
  --mpk-ink: oklch(0.21 0.02 250); --mpk-dim: oklch(0.45 0.022 245); --mpk-dim2: oklch(0.5 0.02 245);
  --mpk-amber: oklch(0.5 0.115 65); --mpk-blue: oklch(0.49 0.17 258);
}
@theme inline {
  --color-mpk-bg: var(--mpk-bg); --color-mpk-bg-soft: var(--mpk-bg-soft); --color-mpk-line: var(--mpk-line);
  --color-mpk-ink: var(--mpk-ink); --color-mpk-dim: var(--mpk-dim); --color-mpk-dim2: var(--mpk-dim2);
  --color-mpk-amber: var(--mpk-amber); --color-mpk-blue: var(--mpk-blue);
  --font-mpk-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
  --font-mpk-sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --animate-mpk-blink: mpk-blink 1s steps(1) infinite;
}
@keyframes mpk-blink { 50% { opacity: 0; } }
```

Components style themselves with Tailwind classes built on these tokens only (`bg-mpk-bg`, `text-mpk-ink`, `border-mpk-line`, `text-mpk-blue`, `font-mpk-mono`, `animate-mpk-blink`, …). No hard-coded colors, no box shadows. Dark mode is next-themes with `attribute="class"` (`.dark` / `.light` on `<html>`).

## 2. Components (`apps/docs/src/registry/<name>.tsx`, each `"use client"`, named export)

### `boot-screen.tsx` → `BootScreen`
A tuigreet-style login screen (clock on top, box with the title set in the border, username typed in, password dots, "authenticating…", key-hint badges at the bottom), then optional matrix rain, then fades out. Any key or click skips it. Respects `prefers-reduced-motion` (skips straight to done).

```ts
type BootScreenProps = {
  user?: string;            // default "guest"
  host?: string;            // default "mpkcn.dev"; title reads "Log in to {host}"
  hints?: { key: string; label: string }[]; // default: ESC Reset · ENTER Start session · ANY KEY Skip
  matrix?: boolean;         // default true: matrix rain after login (skipped on low-power devices)
  oncePerSession?: boolean; // default true: sessionStorage key "mpkcn-booted"
  fullscreen?: boolean;     // default true: fixed overlay; false = fills its parent (for previews)
  onDone?: () => void;
  className?: string;
};
```
Helper `registry/lib/matrix-rain.ts` (`startMatrixRain(canvas): () => void`, sizes to the canvas's parent, color from `--mpk-blue`).

### `theme-toggle.tsx` → `ThemeToggle`
Uses `useTheme` from `next-themes`; avoids a hydration flash.
```ts
type ThemeToggleProps = { variant?: "icon" | "text"; className?: string };
// "icon" (default): round button, moon in dark / sun in light, small spin on swap
// "text": mono button reading "--dark" / "--light", hairline border, blue on hover
```

### `reveal.tsx` → `Reveal`
framer-motion fade/slide in when scrolled into view; nothing moves under reduced motion.
```ts
type RevealProps = { children: React.ReactNode; from?: "up" | "left" | "right" | "scale"; delay?: number; once?: boolean; className?: string };
// defaults: from "up", delay 0, once true; duration 0.7s, ease [0.22, 1, 0.36, 1]
```

## 3. Registry (`apps/docs/src/registry/index.ts`) and JSON for the CLI

```ts
export type RegistryFile = { path: string; target: string };   // path: source file under src/registry; target: where the CLI writes it, relative to the components folder (e.g. "boot-screen.tsx", "lib/matrix-rain.ts")
export type RegistryItem = {
  name: string;            // "boot-screen"
  title: string;           // "Boot Screen"
  description: string;     // one sentence
  dependencies: string[];  // npm packages, e.g. ["next-themes"]
  registryDependencies: string[]; // other mpkcn items it needs, e.g. ["theme"]
  files: RegistryFile[];
};
export const registry: RegistryItem[];
```
Item `theme` = the CSS file above (target `mpkcn-theme.css`). Every component lists `"theme"` in `registryDependencies`.

The docs site serves, as static files at build time:
- `/r/index.json` → `{ name, title, description }[]`
- `/r/<name>.json` → `{ name, title, description, dependencies, registryDependencies, files: { target: string; content: string }[] }`

Default registry URL for the CLI: `https://blhasn-sehli.github.io/mpkcn/r` (GitHub Pages; the site uses `basePath` from env `NEXT_PUBLIC_BASE_PATH`, empty locally). The CLI accepts `--registry <url>` to override (and a local folder path, for tests).

## 4. CLI contract (`packages/cli`, `mpkcn@0.2.0`)

- `mpkcn init`: writes the `theme` item, adds `@import "<relative>/mpkcn-theme.css";` right after `@import "tailwindcss"` in the global CSS (detected, or `--css <path>`; never duplicated), and checks `package.json` for React 19, Tailwind 4 and next-themes (warnings only).
- `mpkcn add <name...>`: resolves `registryDependencies`, writes files (skips existing unless `--overwrite`), runs the init steps quietly when the theme file is missing, installs the npm `dependencies` not already in `package.json` with the detected package manager (`--no-install` prints the command instead; a failed install exits 1), and ends with the import line (`@/` when `tsconfig.json` maps `@/*`).
- Zero runtime dependencies. The package manager runs through `node:child_process` (`shell` only on Windows for the `.cmd` shims); package specs are validated first.

## 5. Rules for contributors
- TypeScript strict, no `any` unless unavoidable.
- Accessible: visible focus, labels on icon buttons, `prefers-reduced-motion` respected.
- Components use only the mpk- tokens: no hard-coded colors, no box shadows.
- Every component is documented (preview, install, props, accessibility) before release.
