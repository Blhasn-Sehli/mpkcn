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
  --font-mpk-mono: var(--font-jetbrains-mono, "JetBrains Mono"), ui-monospace, Consolas, monospace;
  --font-mpk-sans: var(--font-space-grotesk, "Space Grotesk"), ui-sans-serif, system-ui, sans-serif;
  --animate-mpk-blink: mpk-blink 1s steps(1) infinite;
}
@keyframes mpk-blink { 50% { opacity: 0; } }
```

The font stacks read `--font-jetbrains-mono` / `--font-space-grotesk` first: `next/font` sets them on `<html>` (the CLI wires this into the root layout). Without them, the stacks fall back to the font names (loaded by a Google Fonts `@import`) and then to system fonts.

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

### `theme-provider.tsx` → `MpkcnThemeProvider`
next-themes `ThemeProvider` with the mpkcn defaults: `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `themes={["dark", "light"]}`, `disableTransitionOnChange`; any prop overrides a default. A setup item (not shown in the gallery): every component that calls `useTheme` lists it in `registryDependencies`.

### `theme-toggle.tsx` → `ThemeToggle`
Uses `useTheme` from `next-themes`; avoids a hydration flash. `registryDependencies: ["theme", "theme-provider"]`.
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
Item `theme` = the CSS file above (target `mpkcn-theme.css`). Every component lists `"theme"` in `registryDependencies`. Item `theme-provider` = `theme-provider.tsx` (npm dependency `next-themes`).

The docs site serves, as static files at build time:
- `/r/index.json` → `{ name, title, description }[]`
- `/r/<name>.json` → `{ name, title, description, dependencies, registryDependencies, files: { target: string; content: string }[] }`

Default registry URL for the CLI: `https://blhasn-sehli.github.io/mpkcn/r` (GitHub Pages; the site uses `basePath` from env `NEXT_PUBLIC_BASE_PATH`, empty locally). The CLI accepts `--registry <url>` to override (and a local folder path, for tests).

## 4. CLI contract (`packages/cli`, `mpkcn@0.3.0`)

- `mpkcn init`: writes the `theme` item, adds `@import "<relative>/mpkcn-theme.css";` right after `@import "tailwindcss"` in the global CSS (detected, or `--css <path>`; never duplicated), and in a Next.js project also writes `theme-provider`, installs `next-themes` and wires the root layout (below). It checks `package.json` for React 19, Tailwind 4 and next-themes, plus the provider and the fonts (warnings only).
- `mpkcn add <name...>`: resolves `registryDependencies`, writes files (skips existing unless `--overwrite`; the theme and provider files are left alone once present), runs the init steps quietly when the theme file is missing, wires the root layout, installs the npm `dependencies` not already in `package.json` with the detected package manager (`--no-install` prints the command instead; a failed install exits 1), and ends with the import line (`@/` when `tsconfig.json` maps `@/*`).
- Root layout (`src/app/layout.tsx` or `app/layout.tsx`, also `.jsx`/`.js`), only when `next` is a dependency: loads Space Grotesk and JetBrains Mono with `next/font/google` (variables `--font-space-grotesk` / `--font-jetbrains-mono` on `<html>`) and, when the items include `theme-provider`, wraps `{children}` in `<MpkcnThemeProvider>` and adds `suppressHydrationWarning` to `<html>`. Text edits only on the simple create-next-app shape (one `<html>`, one `<body>` whose only content is `{children}`, a `className` that is absent, a string or a single template literal); a layout that already has a `ThemeProvider` / `next-themes` or the font variables is left alone. Anything else: nothing is written and the lines to paste are printed. Idempotent. `--no-layout` never edits the layout; `--no-fonts` skips the fonts. Without Next.js, nothing is edited: the CLI prints the provider usage and a Google Fonts `@import` line.
- Zero runtime dependencies. The package manager runs through `node:child_process` (`shell` only on Windows for the `.cmd` shims); package specs are validated first.

## 5. Rules for contributors
- TypeScript strict, no `any` unless unavoidable.
- Accessible: visible focus, labels on icon buttons, `prefers-reduced-motion` respected.
- Components use only the mpk- tokens: no hard-coded colors, no box shadows.
- Every component is documented (preview, install, props, accessibility) before release.
