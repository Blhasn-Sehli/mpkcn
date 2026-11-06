import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

// Token colors come from CSS variables (see globals.css), which map onto the
// --mpk-* tokens, so highlighted code follows the dark / light theme for free.
const mpkTheme = createCssVariablesTheme({
  name: "mpkcn",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

const LANGS = ["tsx", "ts", "jsx", "js", "bash", "css", "json", "mdx"] as const;
type Lang = (typeof LANGS)[number];

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: [mpkTheme], langs: [...LANGS] });
  return highlighter;
}

const ALIASES: Record<string, Lang> = {
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  typescript: "ts",
  javascript: "js",
};

function toLang(lang: string | undefined): Lang | "text" {
  if (!lang) return "text";
  const l = lang.toLowerCase();
  if ((LANGS as readonly string[]).includes(l)) return l as Lang;
  return ALIASES[l] ?? "text";
}

/** Runs at build time (static export). Returns shiki HTML (a <pre class="shiki">…</pre>) for the given code. */
export async function highlight(code: string, lang?: string): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code.replace(/\n$/, ""), { lang: toLang(lang), theme: "mpkcn" });
}
