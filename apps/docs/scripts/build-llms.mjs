// Builds the llms.txt files (https://llmstxt.org) that AI assistants read to learn mpkcn:
//   public/llms.txt       -> H1, summary, then links to every docs page and registry JSON file
//   public/llms-full.txt  -> every docs page as plain Markdown (MDX with the JSX turned into text)
// Sources: src/lib/docs.ts (pages and order), src/lib/site.ts, src/registry/registry.json
// and src/content/docs/*.mdx. Runs in prebuild, after build-registry.mjs.
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFile(path.join(root, ...p), "utf8").then((t) => t.replace(/\r\n/g, "\n"));

// ---------------------------------------------------------------------------
// Sources

const siteTs = await read("src", "lib", "site.ts");
const site = {
  url: /url:\s*"([^"]+)"/.exec(siteTs)?.[1],
  description: /description:\s*"((?:[^"\\]|\\.)*)"/.exec(siteTs)?.[1],
};
if (!site.url || !site.description) throw new Error("llms: could not read url and description from src/lib/site.ts");

/** The page objects of src/lib/docs.ts, in file order. */
function parsePages(ts) {
  const str = (block, key) => {
    const m = new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(block);
    return m ? JSON.parse(`"${m[1]}"`) : undefined;
  };
  const pages = [];
  const list = /const pages[^=]*=\s*\[([\s\S]*?)\n\];/.exec(ts)?.[1] ?? "";
  for (const m of list.matchAll(/\{[^{}]*?\bslug:[^{}]*\}/g)) {
    const page = {
      slug: str(m[0], "slug"),
      href: str(m[0], "href"),
      title: str(m[0], "title"),
      description: str(m[0], "description"),
      section: str(m[0], "section"),
    };
    if (Object.values(page).some((v) => !v)) throw new Error(`llms: could not parse a page in docs.ts:\n${m[0]}`);
    pages.push(page);
  }
  if (pages.length < 3) throw new Error("llms: found too few pages in src/lib/docs.ts");
  return pages;
}

const pages = parsePages(await read("src", "lib", "docs.ts"));
const registry = JSON.parse(await read("src", "registry", "registry.json"));
const SETUP = new Set(["theme", "theme-provider"]);
const url = (href) => `${site.url}${href}`;

const guides = pages.filter((p) => p.section !== "Components");
const componentPages = pages
  .filter((p) => p.section === "Components" && p.slug !== "components-gallery")
  .sort((a, b) => a.title.localeCompare(b.title));
// Registry components that have a docs page but are not in docs.ts yet still get listed.
for (const item of registry) {
  if (SETUP.has(item.name) || componentPages.some((p) => p.slug === item.name)) continue;
  if (!existsSync(path.join(root, "src", "content", "docs", `${item.name}.mdx`))) continue;
  componentPages.push({
    slug: item.name,
    href: `/docs/components/${item.name}/`,
    title: item.title,
    description: item.description,
    section: "Components",
  });
}
componentPages.sort((a, b) => a.title.localeCompare(b.title));

// ---------------------------------------------------------------------------
// MDX to Markdown

/** Index just past the `{...}` expression that starts at text[i] === "{". */
function skipExpr(text, i) {
  let depth = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") i = skipString(text, i);
    else if (c === "`") i = skipTemplate(text, i);
    else {
      if (c === "{") depth++;
      else if (c === "}" && --depth === 0) return i + 1;
      i++;
    }
  }
  return i;
}

function skipString(text, i) {
  const q = text[i++];
  while (i < text.length && text[i] !== q && text[i] !== "\n") i += text[i] === "\\" ? 2 : 1;
  return i + 1;
}

function skipTemplate(text, i) {
  i++;
  while (i < text.length && text[i] !== "`") {
    if (text[i] === "\\") i += 2;
    else if (text[i] === "$" && text[i + 1] === "{") i = skipExpr(text, i + 1);
    else i++;
  }
  return i + 1;
}

/** Reads the JSX element at text[i] === "<": tag, raw attributes, children and end index. */
function readElement(text, i) {
  const tag = /^<([A-Za-z][\w.]*)/.exec(text.slice(i))[1];
  let j = i + tag.length + 1;
  const attrStart = j;
  while (j < text.length) {
    const c = text[j];
    if (c === "{") j = skipExpr(text, j);
    else if (c === '"' || c === "'") j = skipString(text, j);
    else if (c === "/" && text[j + 1] === ">") {
      return { tag, attrs: parseAttrs(text.slice(attrStart, j)), children: "", end: j + 2 };
    } else if (c === ">") break;
    else j++;
  }
  const attrs = parseAttrs(text.slice(attrStart, j));
  const open = new RegExp(`<${tag}[\\s>/]`, "g");
  const close = `</${tag}>`;
  let depth = 1;
  let k = j + 1;
  while (depth > 0) {
    const nextClose = text.indexOf(close, k);
    if (nextClose === -1) throw new Error(`llms: <${tag}> is never closed`);
    open.lastIndex = k;
    const nextOpen = open.exec(text);
    if (nextOpen && nextOpen.index < nextClose) {
      depth++;
      k = nextOpen.index + tag.length + 1;
    } else {
      depth--;
      k = nextClose + close.length;
      if (depth === 0) return { tag, attrs, children: text.slice(j + 1, nextClose), end: k };
    }
  }
  throw new Error("unreachable");
}

/** name="x", name='x' and name={expr} attributes (expressions kept as source). */
function parseAttrs(raw) {
  const attrs = {};
  let i = 0;
  while (i < raw.length) {
    const m = /^\s*([A-Za-z_][\w-]*)\s*(=\s*)?/.exec(raw.slice(i));
    if (!m || !m[1]) break;
    i += m[0].length;
    if (!m[2]) {
      attrs[m[1]] = true;
      continue;
    }
    if (raw[i] === '"' || raw[i] === "'") {
      const end = skipString(raw, i);
      attrs[m[1]] = raw.slice(i + 1, end - 1);
      i = end;
    } else if (raw[i] === "{") {
      const end = skipExpr(raw, i);
      attrs[m[1]] = { expr: raw.slice(i + 1, end - 1).trim() };
      i = end;
    } else break;
  }
  return attrs;
}

/** The text of a template-literal expression like {`...`}, unescaped. */
function templateText(attr) {
  const expr = attr?.expr;
  if (!expr || !expr.startsWith("`") || !expr.endsWith("`")) return undefined;
  return expr.slice(1, -1).replace(/\\`/g, "`").replace(/\\\$\{/g, "${").replace(/\\\\/g, "\\");
}

function dedent(text) {
  const lines = text.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)[0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

const fence = (code, lang) => `\`\`\`${lang}\n${code.replace(/\n+$/, "")}\n\`\`\``;
const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Markdown for one JSX block; "" drops it. */
function renderElement(el) {
  switch (el.tag) {
    case "InstallTabs":
      return fence(`npx mpkcn add ${el.attrs.name}`, "bash");
    case "ComponentPreview": {
      const code = templateText(el.attrs.code);
      if (code) return fence(code, "tsx");
      const children = el.children.trim();
      // Children that are only a demo component are a live preview, not an example.
      if (!children || /^<\w+Demo\b[^>]*\/>$/.test(children)) return "";
      return fence(dedent(el.children), "tsx");
    }
    case "PropsTable": {
      let rows;
      try {
        rows = new Function(`return (${el.attrs.rows?.expr});`)();
      } catch {
        return "";
      }
      if (!Array.isArray(rows) || !rows.length) return "";
      return [
        "| Prop | Type | Default | Description |",
        "| --- | --- | --- | --- |",
        ...rows.map((r) => `| \`${cell(r.prop)}\` | \`${cell(r.type)}\` | ${cell(r.default)} | ${cell(r.description)} |`),
      ].join("\n");
    }
    case "Callout": {
      const body = mdxToMarkdown(el.children).trim();
      const title = typeof el.attrs.title === "string" ? `**${el.attrs.title}**\n\n` : "";
      return `${title}${body}`
        .split("\n")
        .map((l) => (l ? `> ${l}` : ">"))
        .join("\n");
    }
    case "Steps":
      return mdxToMarkdown(el.children).trim();
    case "McpSetupTabs": {
      const server = { command: "npx", args: ["-y", "mpkcn@latest", "mcp"] };
      const json = (v) => fence(JSON.stringify(v, null, 2), "json");
      return [
        "Claude Code:",
        "",
        fence("claude mcp add mpkcn -- npx -y mpkcn@latest mcp", "bash"),
        "",
        "Cursor, `.cursor/mcp.json`:",
        "",
        json({ mcpServers: { mpkcn: { type: "stdio", ...server } } }),
        "",
        "VS Code, `.vscode/mcp.json`:",
        "",
        json({ servers: { mpkcn: { type: "stdio", ...server } } }),
        "",
        "Windsurf (`~/.codeium/windsurf/mcp_config.json`) and Claude Desktop (`claude_desktop_config.json`):",
        "",
        json({ mcpServers: { mpkcn: server } }),
      ].join("\n");
    }
    default:
      return "";
  }
}

/** Inline JSX in prose: keep the text of paired tags, drop self-closing ones. */
const stripInline = (line) =>
  line.replace(/<([A-Z][\w.]*)\b[^>]*>(.*?)<\/\1>/g, "$2").replace(/<[A-Z][\w.]*\b[^>]*\/>/g, "");

/** MDX source to plain Markdown: imports, exports, comments and demos go; docs components become text. */
function mdxToMarkdown(src) {
  const out = [];
  let i = 0;
  let inFence = false;
  while (i < src.length) {
    const lineEnd = src.indexOf("\n", i) === -1 ? src.length : src.indexOf("\n", i);
    const line = src.slice(i, lineEnd);
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      out.push(line);
      i = lineEnd + 1;
      continue;
    }
    if (inFence) {
      out.push(line);
      i = lineEnd + 1;
      continue;
    }
    if (/^import\s/.test(line)) {
      i = lineEnd + 1;
      continue;
    }
    if (/^export\s/.test(line)) {
      // Skip the whole export statement (it may span several lines).
      const brace = src.indexOf("{", i);
      i = brace !== -1 && brace < lineEnd ? skipExpr(src, brace) : lineEnd;
      const after = src.indexOf("\n", i);
      i = after === -1 ? src.length : after + 1;
      continue;
    }
    if (trimmed.startsWith("{/*")) {
      const end = src.indexOf("*/}", i);
      i = end === -1 ? lineEnd + 1 : end + 3;
      continue;
    }
    if (/^<[A-Z]/.test(trimmed)) {
      const el = readElement(src, i + line.indexOf("<"));
      const md = renderElement(el);
      if (md) out.push("", md, "");
      i = el.end;
      const rest = src.indexOf("\n", i);
      i = rest === -1 ? src.length : rest + 1;
      continue;
    }
    out.push(stripInline(line));
    i = lineEnd + 1;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Output

const summary = site.description;
const about = [
  "mpkcn is distributed like shadcn/ui: `npx mpkcn add <name>` copies a component's source into the project (default `src/components/mpkcn`, or `components/mpkcn` without `src/`), imports `mpkcn-theme.css` in the global CSS, loads the fonts and the theme provider in a Next.js root layout, and installs the npm packages it needs. Every component is a `\"use client\"` React 19 component with a named export, styled with Tailwind CSS 4 utilities built on eight `--mpk-*` tokens, dark and light.",
  "",
  "AI assistants can use the MCP server instead of the shell: `npx -y mpkcn@latest mcp` exposes `list_components`, `get_component`, `add_components` and `init_project`. Claude Code: `claude mcp add mpkcn -- npx -y mpkcn@latest mcp`.",
];

const link = (p) => `- [${p.title}](${url(p.href)}): ${p.description}`;

const llms = [
  "# mpkcn",
  "",
  `> ${summary}`,
  "",
  ...about,
  "",
  "## Docs",
  "",
  ...guides.map(link),
  "",
  "## Components",
  "",
  `- [Gallery](${url("/components/")}): every component running live, with its source and install command.`,
  ...componentPages.map(link),
  "",
  "## Registry",
  "",
  "Static JSON the CLI reads. Each item has `name`, `title`, `description`, `category`, `dependencies` (npm), `registryDependencies` (other mpkcn items), `docs`, `usage` and `files` (`target` path and full `content`).",
  "",
  `- [index.json](${url("/r/index.json")}): every item with its category and dependencies.`,
  ...registry.map((i) => `- [${i.name}.json](${url(`/r/${i.name}.json`)}): ${i.title}, ${i.description}`),
  "",
  "## Optional",
  "",
  `- [llms-full.txt](${url("/llms-full.txt")}): every docs page above as plain Markdown, in one file.`,
  `- [GitHub](https://github.com/Blhasn-Sehli/mpkcn): source, issues and the CLI package.`,
  "",
].join("\n");

const sections = [];
for (const page of [...guides, ...componentPages]) {
  const file = path.join(root, "src", "content", "docs", `${page.slug}.mdx`);
  if (!existsSync(file)) continue;
  const body = mdxToMarkdown(await read("src", "content", "docs", `${page.slug}.mdx`)).trim();
  sections.push([`# ${page.title}`, "", `URL: ${url(page.href)}`, "", `> ${page.description}`, "", body].join("\n"));
}

const full = [`# mpkcn`, "", `> ${summary}`, "", ...about, "", ...sections.flatMap((s) => ["---", "", s, ""])].join("\n");

await writeFile(path.join(root, "public", "llms.txt"), llms, "utf8");
await writeFile(path.join(root, "public", "llms-full.txt"), full, "utf8");
console.log(`llms: wrote public/llms.txt and public/llms-full.txt (${sections.length} pages, ${Math.round(full.length / 1024)} KB)`);
