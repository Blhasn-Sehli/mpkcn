import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HELP, MCP_HELP, parseCli, type ParsedArgs } from "./args.js";
import { addThemeImport, findGlobalCss } from "./css.js";
import { CliError } from "./errors.js";
import { spawnRunner, type Runner } from "./install.js";
import {
  addFonts,
  addProvider,
  findLayout,
  fontLines,
  GOOGLE_FONTS_IMPORT,
  MONO_VAR,
  OLD_THEME_FONTS,
  PROVIDER_NAME,
  providerLines,
  SANS_VAR,
  type EditStatus,
} from "./layout.js";
import {
  assertValidSpec,
  detectPackageManager,
  installArgs,
  installCommand,
  installDevCommand,
  packageName,
  type PackageManager,
} from "./pm.js";
import {
  checkPrerequisites,
  declaredDependencies,
  exportedName,
  importSpecifier,
  isNextProject,
  readPackageJson,
  type Check,
} from "./project.js";
import { fetchIndex, fetchItem, registryFrom, type RegistryItem } from "./registry.js";
import { collectDependencies, resolveItems } from "./resolve.js";
import { writeItems, type WriteResult } from "./write.js";

export type Context = {
  cwd: string;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  /** Runs the package manager. Defaults to a real child process; tests pass a fake. */
  exec?: Runner;
  /** Filled in as the command runs, for callers that want a structured result (the MCP server). */
  report?: Report;
};

/** What add / init did, in a form a program (or an AI assistant) can read. */
export type Report = {
  /** Every file written, skipped or edited, as a path from the project root. */
  files: { path: string; status: "created" | "overwritten" | "skipped" | "updated"; note?: string }[];
  /** npm packages installed by this run. */
  installed: string[];
  /** npm packages the items need that package.json already lists. */
  alreadyInstalled: string[];
  /** The install command, when it was not run (install off) or failed. */
  installCommand?: string;
  installFailed?: boolean;
  /** Import lines for the requested components. */
  imports: string[];
  /** Edits mpkcn could not make itself: what to add, and where. */
  manualSteps: { title: string; lines: string[] }[];
  /** Project checks (React 19, Tailwind 4, next-themes, provider, fonts). */
  checks: Check[];
};

export function emptyReport(): Report {
  return { files: [], installed: [], alreadyInstalled: [], imports: [], manualSteps: [], checks: [] };
}

export const THEME_ITEM = "theme";
export const THEME_FILE = "mpkcn-theme.css";
export const PROVIDER_ITEM = "theme-provider";
export const PROVIDER_FILE = "theme-provider.tsx";

export function getVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
  return pkg.version;
}

/** Default components folder: src/components/mpkcn when the project has src/, else components/mpkcn. */
export function defaultDir(cwd: string): string {
  return existsSync(path.join(cwd, "src"))
    ? path.join("src", "components", "mpkcn")
    : path.join("components", "mpkcn");
}

const toDisplay = (cwd: string, p: string) => path.relative(cwd, p).split(path.sep).join("/") || ".";
const status = (word: string) => `  ${word.padEnd(11)} `;

function printWrites(ctx: Context, results: WriteResult[]): void {
  for (const r of results) {
    const note = r.status === "skipped" ? "  (exists, use --overwrite to replace)" : "";
    ctx.stdout(`${status(r.status)}${toDisplay(ctx.cwd, r.path)}${note}`);
    ctx.report?.files.push({ path: toDisplay(ctx.cwd, r.path), status: r.status });
  }
}

/**
 * Imports the theme into the global CSS. Prints a line when the file changes; with
 * `verbose`, also when it was already there. `hint` prints the manual line when no
 * CSS file is found.
 */
function wireTheme(args: ParsedArgs, ctx: Context, themePath: string, opts: { verbose: boolean; hint: boolean }): void {
  let cssFile: string | undefined;
  if (args.css) {
    cssFile = path.resolve(ctx.cwd, args.css);
  } else {
    cssFile = findGlobalCss(ctx.cwd, themePath);
  }

  if (!cssFile) {
    if (opts.hint) {
      ctx.stdout("");
      ctx.stdout(`No global CSS found. Add this line right after @import "tailwindcss" (path from the project root):`);
      ctx.stdout(`  @import "${toDisplay(ctx.cwd, themePath)}";`);
      ctx.stdout("Or point mpkcn at the file: npx mpkcn init --css <path>");
      ctx.report?.manualSteps.push({
        title: `No global CSS found. Add this line right after @import "tailwindcss" in your global CSS`,
        lines: [`@import "${toDisplay(ctx.cwd, themePath)}";  /* path from the project root: make it relative to the CSS file */`],
      });
    }
    return;
  }

  const result = addThemeImport(cssFile, themePath);
  const shown = toDisplay(ctx.cwd, cssFile);
  if (result.status === "added") {
    ctx.stdout(`${status("updated")}${shown}  (+ ${result.line})`);
    ctx.report?.files.push({ path: shown, status: "updated", note: `+ ${result.line}` });
  }
  else if (opts.verbose) ctx.stdout(`${status("ok")}${shown} already imports the theme`);
}

/** Import specifier for `target` from `fromFile`: the `@/` alias when it covers it, else relative. */
function moduleSpecifier(cwd: string, fromFile: string, target: string): string {
  const { specifier, alias } = importSpecifier(cwd, target);
  if (alias) return specifier;
  const rel = path
    .relative(path.dirname(fromFile), target.replace(/\.(tsx|ts|jsx|js)$/, ""))
    .split(path.sep)
    .join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function printBlock(ctx: Context, title: string, lines: string[]): void {
  ctx.stdout("");
  ctx.stdout(title);
  for (const line of lines) ctx.stdout(`  ${line}`);
  ctx.report?.manualSteps.push({ title, lines });
}

/** Points the theme's font stacks at the next/font variables, if they still have the 0.2 defaults. */
function upgradeThemeFonts(ctx: Context, themePath: string): void {
  let text: string;
  try {
    text = readFileSync(themePath, "utf8");
  } catch {
    return;
  }
  let next = text;
  for (const [from, to] of OLD_THEME_FONTS) next = next.replace(from, to);
  if (next === text) return;
  writeFileSync(themePath, next, "utf8");
  ctx.stdout(`${status("updated")}${toDisplay(ctx.cwd, themePath)}  (fonts read the next/font variables)`);
  ctx.report?.files.push({ path: toDisplay(ctx.cwd, themePath), status: "updated", note: "fonts read the next/font variables" });
}

/** True when `css` already loads the fonts from Google Fonts. */
function cssLoadsFonts(css: string | undefined): boolean {
  try {
    return !!css && readFileSync(css, "utf8").includes("family=JetBrains+Mono");
  } catch {
    return false;
  }
}

const globalCss = (args: ParsedArgs, ctx: Context, dir: string) =>
  args.css ? path.resolve(ctx.cwd, args.css) : findGlobalCss(ctx.cwd, path.join(dir, THEME_FILE));

type LayoutState = { file?: string; provider?: EditStatus; fonts?: EditStatus };

/**
 * Wires the root layout: the theme provider (when `provider`) and the fonts. Edits only
 * simple layouts and prints the lines to paste otherwise. Font hints for a layout that
 * cannot be edited (or a non-Next project) only print when `fontHint` is set.
 */
function wireLayout(
  args: ParsedArgs,
  ctx: Context,
  dir: string,
  opts: { provider: boolean; fontHint: boolean },
): LayoutState {
  const providerPath = path.join(dir, PROVIDER_FILE);
  const themePath = path.join(dir, THEME_FILE);

  if (!isNextProject(ctx.cwd)) {
    if (opts.provider && args.layout) {
      const { specifier } = importSpecifier(ctx.cwd, providerPath);
      printBlock(ctx, "Wrap your app in the theme provider (in your root component):", [
        `import { ${PROVIDER_NAME} } from "${specifier}";`,
        `<${PROVIDER_NAME}><App /></${PROVIDER_NAME}>`,
      ]);
    }
    if (args.fonts && opts.fontHint) {
      const css = globalCss(args, ctx, dir);
      if (!cssLoadsFonts(css)) {
        const where = css ? toDisplay(ctx.cwd, css) : "your global CSS";
        printBlock(ctx, `Load the fonts: add this line at the very top of ${where}:`, [GOOGLE_FONTS_IMPORT]);
      }
    }
    return {};
  }

  const file = findLayout(ctx.cwd);
  const state: LayoutState = { file };
  const shown = file ? toDisplay(ctx.cwd, file) : "app/layout.tsx";
  const specifier = moduleSpecifier(ctx.cwd, file ?? path.join(ctx.cwd, "app", "layout.tsx"), providerPath);

  if (file && args.layout) {
    const original = readFileSync(file, "utf8");
    let text = original;
    const parts: string[] = [];
    if (args.fonts) {
      const r = addFonts(text);
      text = r.text;
      state.fonts = r.status;
      if (r.status === "added") parts.push("fonts");
    }
    if (opts.provider) {
      const r = addProvider(text, specifier);
      text = r.text;
      state.provider = r.status;
      if (r.status === "added") parts.push("theme provider");
    }
    if (text !== original) {
      writeFileSync(file, text, "utf8");
      ctx.stdout(`${status("updated")}${shown}  (+ ${parts.join(", ")})`);
      ctx.report?.files.push({ path: shown, status: "updated", note: `+ ${parts.join(", ")}` });
    }
    if (state.fonts === "added" || state.fonts === "present") upgradeThemeFonts(ctx, themePath);
    if (state.provider === "custom") ctx.stdout(`${status("ok")}${shown} already has a ThemeProvider`);
  }

  const reason = file ? `${shown} has an unusual shape, so it was left as is.` : "No root layout found.";
  if (opts.provider && args.layout && (!file || state.provider === "unsupported")) {
    printBlock(ctx, `${reason} Add the theme provider to it:`, providerLines(specifier));
  }
  if (args.fonts && opts.fontHint && (!file || !args.layout || state.fonts === "unsupported")) {
    const lead = file && args.layout && state.provider !== "added" ? `${shown} was left as is. ` : "";
    printBlock(ctx, `${lead}Load the fonts in your root layout:`, fontLines());
  }
  return state;
}

/** init's extra checks: the theme provider and the fonts. */
function layoutChecks(args: ParsedArgs, ctx: Context, dir: string): Check[] {
  if (!readPackageJson(ctx.cwd)) return [];
  const checks: Check[] = [];
  if (isNextProject(ctx.cwd)) {
    const file = findLayout(ctx.cwd);
    if (!file) return [];
    const shown = toDisplay(ctx.cwd, file);
    const text = readFileSync(file, "utf8");
    if (args.layout) {
      checks.push(
        /ThemeProvider/.test(text)
          ? { ok: true, message: `theme provider in ${shown}` }
          : { ok: false, message: `the theme provider is not in ${shown}. Fix: add the lines above` },
      );
    }
    if (args.fonts) {
      checks.push(
        text.includes(SANS_VAR) && text.includes(MONO_VAR)
          ? { ok: true, message: `fonts loaded with next/font in ${shown}` }
          : { ok: false, message: `the fonts are not loaded in ${shown}. Fix: add the lines above` },
      );
    }
    return checks;
  }
  if (args.fonts) {
    const css = globalCss(args, ctx, dir);
    checks.push(
      css && cssLoadsFonts(css)
        ? { ok: true, message: `fonts loaded from Google Fonts in ${toDisplay(ctx.cwd, css)}` }
        : { ok: false, message: "the fonts are not loaded. Fix: add the @import line above" },
    );
  }
  return checks;
}

function printChecks(
  ctx: Context,
  pm: PackageManager,
  opts: { verbose: boolean; skip?: Set<string>; extra?: Check[] },
): number {
  const checks = checkPrerequisites(
    ctx.cwd,
    { install: (d) => installCommand(pm, d), installDev: (d) => installDevCommand(pm, d) },
    opts.skip,
  );
  checks.push(...(opts.extra ?? []));
  ctx.report?.checks.push(...checks);
  const shown = opts.verbose ? checks : checks.filter((c) => !c.ok);
  if (shown.length) {
    ctx.stdout("");
    ctx.stdout(opts.verbose ? "Checks" : "Heads up");
    for (const c of shown) ctx.stdout(`  ${c.ok ? "ok  " : "warn"}  ${c.message}`);
  }
  return checks.filter((c) => !c.ok).length;
}

function assertCssExists(args: ParsedArgs, ctx: Context): void {
  if (args.css && !existsSync(path.resolve(ctx.cwd, args.css))) throw new CliError(`CSS file not found: ${args.css}`);
}

/** An item the CLI adds on its own; undefined when the registry does not have it. */
async function fetchOptional(registry: string, name: string, cwd: string): Promise<RegistryItem | undefined> {
  try {
    return await fetchItem(registry, name, cwd);
  } catch {
    return undefined;
  }
}

export async function runInit(args: ParsedArgs, ctx: Context): Promise<number> {
  const registry = registryFrom(args.registry);
  const dir = path.resolve(ctx.cwd, args.dir ?? defaultDir(ctx.cwd));
  const themePath = path.join(dir, THEME_FILE);

  assertCssExists(args, ctx);
  ctx.stdout("Setting up mpkcn");
  if (existsSync(themePath) && !args.overwrite) {
    ctx.stdout(`${status("ok")}${toDisplay(ctx.cwd, themePath)} already there`);
  } else {
    const theme = await fetchItem(registry, THEME_ITEM, ctx.cwd);
    printWrites(ctx, await writeItems([theme], dir, { overwrite: args.overwrite }));
  }

  // Next.js: the theme provider too, so the dark / light switch works out of the box.
  const added: RegistryItem[] = [];
  let provider = false;
  if (isNextProject(ctx.cwd)) {
    const providerPath = path.join(dir, PROVIDER_FILE);
    if (existsSync(providerPath) && !args.overwrite) {
      provider = true;
      ctx.stdout(`${status("ok")}${toDisplay(ctx.cwd, providerPath)} already there`);
    } else {
      const item = await fetchOptional(registry, PROVIDER_ITEM, ctx.cwd);
      if (item) {
        printWrites(ctx, await writeItems([item], dir, { overwrite: args.overwrite }));
        added.push(item);
        provider = true;
      }
    }
  }
  wireTheme(args, ctx, themePath, { verbose: true, hint: true });
  wireLayout(args, ctx, dir, { provider, fontHint: true });
  if (!(await installDeps(args, ctx, added, { quiet: true }))) return 1;

  const pm = detectPackageManager(ctx.cwd);
  const skip = new Set(collectDependencies(added).map(packageName));
  const warnings = printChecks(ctx, pm, { verbose: true, skip, extra: layoutChecks(args, ctx, dir) });

  ctx.stdout("");
  ctx.stdout(
    warnings
      ? "Fix the warnings above, then add a component: npx mpkcn add boot-screen"
      : "Ready. Add a component: npx mpkcn add boot-screen  (all of them: npx mpkcn list)",
  );
  return 0;
}

/** Installs the npm packages the items need that package.json does not list yet. */
async function installDeps(
  args: ParsedArgs,
  ctx: Context,
  items: RegistryItem[],
  opts: { quiet?: boolean } = {},
): Promise<boolean> {
  const deps = collectDependencies(items);
  deps.forEach(assertValidSpec);
  const declared = declaredDependencies(readPackageJson(ctx.cwd));
  const missing = deps.filter((d) => !declared.has(packageName(d)));
  const present = deps.filter((d) => declared.has(packageName(d)));

  ctx.report?.alreadyInstalled.push(...present);
  if (present.length && !opts.quiet) {
    ctx.stdout("");
    ctx.stdout(`Already in package.json: ${present.join(", ")}`);
  }
  if (!missing.length) return true;

  const pm = detectPackageManager(ctx.cwd);
  const command = installCommand(pm, missing);
  ctx.stdout("");
  if (!args.install) {
    if (ctx.report) ctx.report.installCommand = command;
    ctx.stdout("Install the npm dependencies:");
    ctx.stdout(`  ${command}`);
    return true;
  }

  ctx.stdout("Installing dependencies");
  ctx.stdout(`  ${command}`);
  const { cmd, args: cmdArgs } = installArgs(pm, missing);
  const code = await (ctx.exec ?? spawnRunner)(cmd, cmdArgs, { cwd: ctx.cwd });
  if (code !== 0) {
    if (ctx.report) {
      ctx.report.installCommand = command;
      ctx.report.installFailed = true;
    }
    ctx.stderr("");
    ctx.stderr(`error: the install failed (exit code ${code}). The files are in place; run it yourself:`);
    ctx.stderr(`  ${command}`);
    return false;
  }
  ctx.report?.installed.push(...missing);
  return true;
}

/** The main source file of an item: "<name>.tsx" if present, else its first script file. */
export function mainFile(item: RegistryItem) {
  return (
    item.files.find((f) => /^[^/\\]+\.(tsx|ts|jsx|js)$/.test(f.target) && f.target.startsWith(`${item.name}.`)) ??
    item.files.find((f) => /\.(tsx|ts|jsx|js)$/.test(f.target))
  );
}

export async function runAdd(args: ParsedArgs, ctx: Context): Promise<number> {
  const registry = registryFrom(args.registry);
  const dir = path.resolve(ctx.cwd, args.dir ?? defaultDir(ctx.cwd));
  const themePath = path.join(dir, THEME_FILE);
  const firstRun = !existsSync(themePath);
  assertCssExists(args, ctx);

  const requested = new Set(args.names);
  let items = await resolveItems(args.names, (name) => fetchItem(registry, name, ctx.cwd));
  if (firstRun && !items.some((i) => i.name === THEME_ITEM)) {
    const theme = await fetchOptional(registry, THEME_ITEM, ctx.cwd);
    if (theme) items.unshift(theme);
  }
  const needsProvider = items.some((i) => i.name === PROVIDER_ITEM);
  // Once the theme and the provider are in place, leave them alone unless asked for (keeps the output short).
  const inPlace = (i: RegistryItem) =>
    (i.name === THEME_ITEM && !firstRun) || (i.name === PROVIDER_ITEM && existsSync(path.join(dir, PROVIDER_FILE)));
  if (!args.overwrite) items = items.filter((i) => !inPlace(i) || requested.has(i.name));

  const extra = items.filter((i) => !requested.has(i.name)).map((i) => i.name);
  ctx.stdout(`Adding ${args.names.join(", ")}${extra.length ? ` (+ ${extra.join(", ")})` : ""}`);
  printWrites(ctx, await writeItems(items, dir, { overwrite: args.overwrite }));

  if (existsSync(themePath)) wireTheme(args, ctx, themePath, { verbose: false, hint: firstRun || !!args.css });
  wireLayout(args, ctx, dir, { provider: needsProvider, fontHint: firstRun });
  if (firstRun) {
    const skip = new Set(collectDependencies(items).map(packageName));
    printChecks(ctx, detectPackageManager(ctx.cwd), { verbose: false, skip });
  }

  if (!(await installDeps(args, ctx, items))) return 1;

  const imports = items
    .filter((i) => requested.has(i.name))
    .flatMap((i) => {
      const file = mainFile(i);
      if (!file) return [];
      const { specifier, alias } = importSpecifier(ctx.cwd, path.resolve(dir, file.target));
      const line = `import { ${exportedName(file.content, i.name)} } from "${specifier}";`;
      return [alias ? line : `${line}  // path from the project root: make it relative to your file`];
    });

  ctx.report?.imports.push(...imports);
  ctx.stdout("");
  if (imports.length) {
    ctx.stdout(`Done. Use ${imports.length > 1 ? "them" : "it"}:`);
    for (const line of imports) ctx.stdout(`  ${line}`);
  } else {
    ctx.stdout("Done.");
  }
  return 0;
}

export async function runList(args: ParsedArgs, ctx: Context): Promise<void> {
  const entries = await fetchIndex(registryFrom(args.registry), ctx.cwd);
  if (entries.length === 0) {
    ctx.stdout("No components in this registry.");
    return;
  }
  const width = Math.max(...entries.map((e) => e.name.length));
  for (const e of entries) ctx.stdout(`${e.name.padEnd(width)}  ${e.description}`.trimEnd());
}

/** Runs the CLI and returns the process exit code. */
export async function run(argv: string[], ctx: Context): Promise<number> {
  let args: ParsedArgs;
  try {
    args = parseCli(argv);
  } catch (err) {
    ctx.stderr(`error: ${(err as Error).message}`);
    ctx.stderr("");
    ctx.stderr(HELP);
    return 1;
  }

  try {
    switch (args.command) {
      case "help":
        ctx.stdout(args.topic === "mcp" ? MCP_HELP : HELP);
        return 0;
      case "mcp": {
        const { runMcp } = await import("./mcp.js");
        return await runMcp(args, ctx);
      }
      case "version":
        ctx.stdout(getVersion());
        return 0;
      case "list":
        await runList(args, ctx);
        return 0;
      case "init":
        return await runInit(args, ctx);
      case "add":
        return await runAdd(args, ctx);
    }
  } catch (err) {
    if (err instanceof CliError) {
      ctx.stderr(`error: ${err.message}`);
      return 1;
    }
    ctx.stderr(`error: unexpected failure: ${(err as Error).stack ?? String(err)}`);
    return 1;
  }
}
