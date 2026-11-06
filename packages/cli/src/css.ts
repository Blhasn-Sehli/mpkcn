import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CliError } from "./errors.js";

/** Where Next.js, Vite and similar starters keep their global stylesheet, most likely first. */
export const CSS_CANDIDATES = [
  "src/app/globals.css",
  "app/globals.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/index.css",
  "src/globals.css",
  "src/global.css",
  "src/styles.css",
  "src/app.css",
  "app/global.css",
  "app/app.css",
  "index.css",
  "globals.css",
];

const TAILWIND_IMPORT_RE = /^[ \t]*@import\s+(?:url\()?\s*["']tailwindcss["'][^;\r\n]*;?[^\r\n]*$/m;
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".vercel", "coverage"]);

const hasTailwindImport = (file: string) => {
  try {
    return TAILWIND_IMPORT_RE.test(readFileSync(file, "utf8"));
  } catch {
    return false;
  }
};

/** CSS files under `dir` (depth-limited, skipping build and dependency folders). */
function scanCss(dir: string, depth: number, found: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (depth > 0 && !SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) scanCss(full, depth - 1, found);
    } else if (e.isFile() && e.name.endsWith(".css")) {
      found.push(full);
    }
  }
}

/**
 * Finds the project's global CSS: a known path that imports Tailwind, then any CSS
 * file that imports Tailwind, then any known path. Undefined when nothing fits.
 * `exclude` (the theme file itself) is never returned.
 */
export function findGlobalCss(cwd: string, exclude?: string): string | undefined {
  const isExcluded = (f: string) => exclude !== undefined && path.resolve(f) === path.resolve(exclude);
  const known = CSS_CANDIDATES.map((c) => path.join(cwd, c)).filter((f) => existsSync(f) && !isExcluded(f));
  const knownTw = known.find(hasTailwindImport);
  if (knownTw) return knownTw;

  const scanned: string[] = [];
  scanCss(cwd, 4, scanned);
  const anyTw = scanned.sort().find((f) => !isExcluded(f) && hasTailwindImport(f));
  return anyTw ?? known[0];
}

/** The @import path from `cssFile` to `themeFile`: "../components/mpkcn/mpkcn-theme.css". */
export function relativeImport(cssFile: string, themeFile: string): string {
  const rel = path.relative(path.dirname(cssFile), themeFile).split(path.sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

export type ImportResult = { status: "added" | "present"; line: string };

/**
 * Adds `@import "<theme>";` to `cssFile`, right after the Tailwind import (or after the
 * last leading @import, or at the top). Does nothing if the theme is already imported.
 */
export function addThemeImport(cssFile: string, themeFile: string): ImportResult {
  let text: string;
  try {
    text = readFileSync(cssFile, "utf8");
  } catch {
    throw new CliError(`Could not read the CSS file ${cssFile}.`);
  }
  const line = `@import "${relativeImport(cssFile, themeFile)}";`;
  const themeBase = path.basename(themeFile).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`@import\\s+(?:url\\()?\\s*["'][^"']*${themeBase}["']`).test(text)) {
    return { status: "present", line };
  }

  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const tw = TAILWIND_IMPORT_RE.exec(text);
  let next: string;
  if (tw) {
    const end = tw.index + tw[0].length;
    next = `${text.slice(0, end)}${eol}${line}${text.slice(end)}`;
  } else {
    const imports = [...text.matchAll(/^[ \t]*@import[^\r\n]*$/gm)];
    const last = imports.at(-1);
    if (last && last.index !== undefined) {
      const end = last.index + last[0].length;
      next = `${text.slice(0, end)}${eol}${line}${text.slice(end)}`;
    } else {
      next = `${line}${eol}${text}`;
    }
  }
  writeFileSync(cssFile, next, "utf8");
  return { status: "added", line };
}
