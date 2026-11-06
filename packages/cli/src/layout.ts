import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Safe, text-level edits to a Next.js root layout: wrap `{children}` in the mpkcn theme
 * provider and load the fonts with next/font. An edit is only made when the file has
 * the simple create-next-app shape; anything else is reported as "unsupported" and the
 * caller prints the lines to paste instead. Every edit is idempotent.
 */

/** Root layouts of the App Router, most likely first. */
export const LAYOUT_CANDIDATES = [
  "src/app/layout.tsx",
  "app/layout.tsx",
  "src/app/layout.jsx",
  "app/layout.jsx",
  "src/app/layout.js",
  "app/layout.js",
];

export function findLayout(cwd: string): string | undefined {
  return LAYOUT_CANDIDATES.map((c) => path.join(cwd, c)).find((f) => existsSync(f));
}

/**
 * added: the edit was made. present: already there. custom: the layout has its own
 * provider or fonts, left alone. unsupported: the shape is not simple enough to edit safely.
 */
export type EditStatus = "added" | "present" | "custom" | "unsupported";

export const PROVIDER_NAME = "MpkcnThemeProvider";
export const SANS_VAR = "--font-space-grotesk";
export const MONO_VAR = "--font-jetbrains-mono";
const SANS_ID = "spaceGrotesk";
const MONO_ID = "jetbrainsMono";
const FONT_CLASSES = `\${${SANS_ID}.variable} \${${MONO_ID}.variable}`;

/** The lines a user pastes when the provider cannot be added automatically. */
export function providerLines(specifier: string): string[] {
  return [
    `import { ${PROVIDER_NAME} } from "${specifier}";`,
    `<html lang="en" suppressHydrationWarning>`,
    `<body><${PROVIDER_NAME}>{children}</${PROVIDER_NAME}></body>`,
  ];
}

/** The lines a user pastes when the fonts cannot be added automatically. */
export function fontLines(): string[] {
  return [
    `import { JetBrains_Mono, Space_Grotesk } from "next/font/google";`,
    `const ${SANS_ID} = Space_Grotesk({ subsets: ["latin"], variable: "${SANS_VAR}" });`,
    `const ${MONO_ID} = JetBrains_Mono({ subsets: ["latin"], variable: "${MONO_VAR}" });`,
    `<html className={\`${FONT_CLASSES}\`}>`,
  ];
}

/** For projects without next/font: Google Fonts as a CSS import, first line of the global CSS. */
export const GOOGLE_FONTS_IMPORT =
  '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap");';

// ---------------------------------------------------------------------------
// A tiny JSX-aware scanner: enough to find an opening tag and its attributes.

type Attr = { name: string; start: number; end: number; valueStart?: number; valueEnd?: number };
type Tag = { start: number; end: number; attrs: Attr[]; spread: boolean };

/** Index just after the string that starts at `i` (a ' or " quote). -1 when unterminated. */
function skipString(text: string, i: number): number {
  const q = text[i];
  for (let k = i + 1; k < text.length; k++) {
    if (text[k] === "\\") k++;
    else if (text[k] === q) return k + 1;
    else if (text[k] === "\n") return -1;
  }
  return -1;
}

/** Index just after the template literal that starts at `i` (a backtick). -1 when unterminated. */
function skipTemplate(text: string, i: number): number {
  for (let k = i + 1; k < text.length; k++) {
    const c = text[k];
    if (c === "\\") k++;
    else if (c === "`") return k + 1;
    else if (c === "$" && text[k + 1] === "{") {
      const end = skipBraces(text, k + 1);
      if (end < 0) return -1;
      k = end - 1;
    }
  }
  return -1;
}

/** Index just after the `}` matching the `{` at `i`. -1 when unbalanced. */
function skipBraces(text: string, i: number): number {
  let depth = 0;
  for (let k = i; k < text.length; k++) {
    const c = text[k];
    if (c === '"' || c === "'") {
      const end = skipString(text, k);
      if (end < 0) return -1;
      k = end - 1;
    } else if (c === "`") {
      const end = skipTemplate(text, k);
      if (end < 0) return -1;
      k = end - 1;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) return k + 1;
    }
  }
  return -1;
}

const tagRe = (name: string) => new RegExp(`<${name}(?=[\\s>])`, "g");

/** The single opening `<name ...>` tag of the file; undefined when absent, repeated or odd. */
function findTag(text: string, name: string): Tag | undefined {
  const hits = [...text.matchAll(tagRe(name))];
  if (hits.length !== 1 || hits[0].index === undefined) return undefined;
  const start = hits[0].index;
  const attrs: Attr[] = [];
  let spread = false;
  let i = start + 1 + name.length;
  while (i < text.length) {
    while (/\s/.test(text[i] ?? "")) i++;
    const c = text[i];
    if (c === ">") return { start, end: i, attrs, spread };
    if (c === undefined || c === "/") return undefined;
    if (c === "{") {
      const end = skipBraces(text, i);
      if (end < 0) return undefined;
      spread = true;
      i = end;
      continue;
    }
    const m = /^[A-Za-z_][\w:.-]*/.exec(text.slice(i));
    if (!m) return undefined;
    const attr: Attr = { name: m[0], start: i, end: i + m[0].length };
    i = attr.end;
    let j = i;
    while (/\s/.test(text[j] ?? "")) j++;
    if (text[j] === "=") {
      j++;
      while (/\s/.test(text[j] ?? "")) j++;
      const v = text[j];
      const end = v === '"' || v === "'" ? skipString(text, j) : v === "{" ? skipBraces(text, j) : -1;
      if (end < 0) return undefined;
      attr.valueStart = j;
      attr.valueEnd = end;
      attr.end = end;
      i = end;
    }
    attrs.push(attr);
  }
  return undefined;
}

/** Leading whitespace of the line that contains `pos`. */
function indentAt(text: string, pos: number): string {
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  return /^[ \t]*/.exec(text.slice(lineStart))?.[0] ?? "";
}

const eolOf = (text: string) => (text.includes("\r\n") ? "\r\n" : "\n");
const splice = (text: string, at: number, del: number, insert: string) =>
  text.slice(0, at) + insert + text.slice(at + del);

/** Adds an attribute at the end of an opening tag, on its own line when the tag spans lines. */
function addAttr(text: string, tag: Tag, attr: string): string {
  let p = tag.end;
  while (p > tag.start && /\s/.test(text[p - 1])) p--;
  if (text.slice(tag.start, tag.end).includes("\n")) {
    return splice(text, p, 0, `${eolOf(text)}${indentAt(text, p - 1)}${attr}`);
  }
  return splice(text, p, 0, ` ${attr}`);
}

type ImportInfo = { end: number; lastFromEnd: number; quote: string; semi: string };

const IMPORT_RE = /^import\s+(?:[^;'"]*?\s+from\s*)?(["'])[^"'\r\n]+\1;?[ \t]*$/gm;

/** Where the import block ends, and the quote and semicolon style it uses. */
function importInfo(text: string): ImportInfo | undefined {
  const all = [...text.matchAll(IMPORT_RE)];
  if (!all.length) return undefined;
  const endOf = (m: RegExpMatchArray) => (m.index ?? 0) + m[0].trimEnd().length;
  const withFrom = all.filter((m) => /\sfrom\s*["']/.test(m[0]));
  const first = all[0][0].trimEnd();
  return {
    end: endOf(all[all.length - 1]),
    lastFromEnd: endOf(withFrom.at(-1) ?? all[all.length - 1]),
    quote: all[0][1],
    semi: first.endsWith(";") ? ";" : "",
  };
}

/** The file still has exactly one <html> and one <body> with a parseable opening tag. */
function stillValid(text: string): boolean {
  const body = findTag(text, "body");
  return !!findTag(text, "html") && !!body && text.split("</body>").length === 2 && text.indexOf("</body>") > body.end;
}

// ---------------------------------------------------------------------------
// Provider

/** Wraps `{children}` in the provider, adds suppressHydrationWarning and the import. */
export function addProvider(text: string, specifier: string): { text: string; status: EditStatus } {
  if (text.includes(PROVIDER_NAME)) return { text, status: "present" };
  if (/next-themes|ThemeProvider/.test(text)) return { text, status: "custom" };
  const unsupported = { text, status: "unsupported" as const };

  const html = findTag(text, "html");
  const body = findTag(text, "body");
  const imports = importInfo(text);
  if (!html || !body || html.spread || !imports || body.start < html.end) return unsupported;
  const close = text.indexOf("</body>");
  if (close < body.end || text.split("</body>").length !== 2) return unsupported;
  const inner = text.slice(body.end + 1, close);
  if (!/^\s*\{\s*children\s*\}\s*$/.test(inner)) return unsupported;

  const eol = eolOf(text);
  const wrapped = `<${PROVIDER_NAME}>{children}</${PROVIDER_NAME}>`;
  let next = text;
  // Edit from the end of the file backwards so earlier positions stay valid.
  if (inner.includes("\n")) {
    next = splice(next, body.end + 1, inner.length, inner.replace(/\{\s*children\s*\}/, wrapped));
  } else {
    const indent = indentAt(next, body.start);
    next = splice(next, body.end + 1, inner.length, `${eol}${indent}  ${wrapped}${eol}${indent}`);
  }
  if (!html.attrs.some((a) => a.name === "suppressHydrationWarning")) {
    next = addAttr(next, html, "suppressHydrationWarning");
  }
  const q = imports.quote;
  next = splice(next, imports.lastFromEnd, 0, `${eol}import { ${PROVIDER_NAME} } from ${q}${specifier}${q}${imports.semi}`);

  return stillValid(next) && next.includes(wrapped) ? { text: next, status: "added" } : unsupported;
}

// ---------------------------------------------------------------------------
// Fonts

const GOOGLE_IMPORT_RE = /^import\s*\{([^}\r\n]*)\}\s*from\s*(["'])next\/font\/google\2;?[ \t]*$/m;

/** Loads Space Grotesk and JetBrains Mono with next/font and sets their variables on <html>. */
export function addFonts(text: string): { text: string; status: EditStatus } {
  if (text.includes(SANS_VAR) && text.includes(MONO_VAR)) return { text, status: "present" };
  const unsupported = { text, status: "unsupported" as const };
  if (new RegExp(`\\b(JetBrains_Mono|Space_Grotesk|${SANS_ID}|${MONO_ID})\\b`).test(text)) return unsupported;

  const html = findTag(text, "html");
  const imports = importInfo(text);
  if (!html || html.spread || !imports || !findTag(text, "body")) return unsupported;

  // 1. The className on <html> (the last edit position, so it goes first).
  const eol = eolOf(text);
  let next = text;
  const cls = html.attrs.find((a) => a.name === "className");
  if (!cls) {
    next = addAttr(next, html, `className={\`${FONT_CLASSES}\`}`);
  } else {
    if (cls.valueStart === undefined || cls.valueEnd === undefined) return unsupported;
    const raw = text.slice(cls.valueStart, cls.valueEnd);
    let value: string | undefined;
    const literal = /^\{?\s*(["'])([^"'`$\\\r\n]*)\1\s*\}?$/.exec(raw);
    const template = /^\{\s*`([\s\S]*)`\s*\}$/.exec(raw);
    if (literal && (raw.startsWith("{") === raw.endsWith("}"))) {
      const classes = literal[2].trim();
      value = `{\`${classes ? `${classes} ` : ""}${FONT_CLASSES}\`}`;
    } else if (template) {
      const tick = raw.indexOf("`");
      if (skipTemplate(raw, tick) !== raw.lastIndexOf("`") + 1) return unsupported; // one template only
      // Next to the other font variables when there are some, else at the end.
      const body = template[1].trimEnd();
      const lastVar = [...body.matchAll(/\$\{[\w.]+\.variable\}/g)].at(-1);
      const at = lastVar?.index !== undefined ? lastVar.index + lastVar[0].length : body.length;
      const merged = at === 0 ? FONT_CLASSES : `${body.slice(0, at)} ${FONT_CLASSES}${body.slice(at)}`;
      value = `{\`${merged}\`}`;
    } else {
      return unsupported; // cn(...), a variable, etc.
    }
    next = splice(next, cls.valueStart, cls.valueEnd - cls.valueStart, value);
  }

  // 2. The two font constants: after the last next/font constant, else after the imports.
  const q = imports.quote;
  const s = imports.semi;
  const decl = (id: string, fn: string, v: string) =>
    `const ${id} = ${fn}({${eol}  variable: ${q}${v}${q},${eol}  subsets: [${q}latin${q}],${eol}})${s}`;
  const consts = `${eol}${eol}${decl(SANS_ID, "Space_Grotesk", SANS_VAR)}${eol}${eol}${decl(MONO_ID, "JetBrains_Mono", MONO_VAR)}`;
  const google = GOOGLE_IMPORT_RE.exec(next);
  const fontFns = google ? google[1].split(",").map((n) => n.trim().split(/\s+as\s+/).pop()!).filter(Boolean) : [];
  let after = imports.end;
  if (fontFns.length) {
    const declRe = new RegExp(`^(?:export\\s+)?const\\s+\\w+\\s*=\\s*(?:${fontFns.join("|")})\\(\\{[\\s\\S]*?^\\}\\);?[ \\t]*$`, "gm");
    const last = [...next.matchAll(declRe)].at(-1);
    if (last?.index !== undefined) after = last.index + last[0].trimEnd().length;
  }
  if (after > html.start) return unsupported;
  next = splice(next, after, 0, consts);

  // 3. The import: merged into an existing one-line next/font/google import, else a new line.
  if (google?.index !== undefined) {
    const names = google[1].trim().replace(/,\s*$/, "");
    const line = `import { ${names ? `${names}, ` : ""}JetBrains_Mono, Space_Grotesk } from ${google[2]}next/font/google${google[2]}${s}`;
    next = splice(next, google.index, google[0].trimEnd().length, line);
  } else {
    next = splice(next, imports.lastFromEnd, 0, `${eol}import { JetBrains_Mono, Space_Grotesk } from ${q}next/font/google${q}${s}`);
  }

  return stillValid(next) ? { text: next, status: "added" } : unsupported;
}

/** The 0.2 theme font lines, which the CLI upgrades in place (only when untouched). */
export const OLD_THEME_FONTS: [string, string][] = [
  [
    `--font-mpk-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;`,
    `--font-mpk-mono: var(${MONO_VAR}, "JetBrains Mono"), ui-monospace, Consolas, monospace;`,
  ],
  [
    `--font-mpk-sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;`,
    `--font-mpk-sans: var(${SANS_VAR}, "Space Grotesk"), ui-sans-serif, system-ui, sans-serif;`,
  ],
];
