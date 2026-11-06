import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { HELP, parseCli, type ParsedArgs } from "./args.js";
import { addThemeImport, findGlobalCss } from "./css.js";
import { CliError } from "./errors.js";
import { spawnRunner, type Runner } from "./install.js";
import {
  assertValidSpec,
  detectPackageManager,
  installArgs,
  installCommand,
  installDevCommand,
  packageName,
  type PackageManager,
} from "./pm.js";
import { checkPrerequisites, declaredDependencies, exportedName, importSpecifier, readPackageJson } from "./project.js";
import { DEFAULT_REGISTRY, fetchIndex, fetchItem, type RegistryItem } from "./registry.js";
import { collectDependencies, resolveItems } from "./resolve.js";
import { writeItems, type WriteResult } from "./write.js";

export type Context = {
  cwd: string;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  /** Runs the package manager. Defaults to a real child process; tests pass a fake. */
  exec?: Runner;
};

export const THEME_ITEM = "theme";
export const THEME_FILE = "mpkcn-theme.css";

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
    }
    return;
  }

  const result = addThemeImport(cssFile, themePath);
  const shown = toDisplay(ctx.cwd, cssFile);
  if (result.status === "added") ctx.stdout(`${status("updated")}${shown}  (+ ${result.line})`);
  else if (opts.verbose) ctx.stdout(`${status("ok")}${shown} already imports the theme`);
}

function printChecks(ctx: Context, pm: PackageManager, opts: { verbose: boolean; skip?: Set<string> }): number {
  const checks = checkPrerequisites(
    ctx.cwd,
    { install: (d) => installCommand(pm, d), installDev: (d) => installDevCommand(pm, d) },
    opts.skip,
  );
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

async function fetchTheme(registry: string, cwd: string): Promise<RegistryItem | undefined> {
  try {
    return await fetchItem(registry, THEME_ITEM, cwd);
  } catch {
    return undefined;
  }
}

export async function runInit(args: ParsedArgs, ctx: Context): Promise<number> {
  const registry = args.registry ?? DEFAULT_REGISTRY;
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
  wireTheme(args, ctx, themePath, { verbose: true, hint: true });

  const pm = detectPackageManager(ctx.cwd);
  const warnings = printChecks(ctx, pm, { verbose: true });

  ctx.stdout("");
  ctx.stdout(
    warnings
      ? "Fix the warnings above, then add a component: npx mpkcn add boot-screen"
      : "Ready. Add a component: npx mpkcn add boot-screen  (all of them: npx mpkcn list)",
  );
  return 0;
}

/** Installs the npm packages the items need that package.json does not list yet. */
async function installDeps(args: ParsedArgs, ctx: Context, items: RegistryItem[]): Promise<boolean> {
  const deps = collectDependencies(items);
  deps.forEach(assertValidSpec);
  const declared = declaredDependencies(readPackageJson(ctx.cwd));
  const missing = deps.filter((d) => !declared.has(packageName(d)));
  const present = deps.filter((d) => declared.has(packageName(d)));

  if (present.length) {
    ctx.stdout("");
    ctx.stdout(`Already in package.json: ${present.join(", ")}`);
  }
  if (!missing.length) return true;

  const pm = detectPackageManager(ctx.cwd);
  const command = installCommand(pm, missing);
  ctx.stdout("");
  if (!args.install) {
    ctx.stdout("Install the npm dependencies:");
    ctx.stdout(`  ${command}`);
    return true;
  }

  ctx.stdout("Installing dependencies");
  ctx.stdout(`  ${command}`);
  const { cmd, args: cmdArgs } = installArgs(pm, missing);
  const code = await (ctx.exec ?? spawnRunner)(cmd, cmdArgs, { cwd: ctx.cwd });
  if (code !== 0) {
    ctx.stderr("");
    ctx.stderr(`error: the install failed (exit code ${code}). The files are in place; run it yourself:`);
    ctx.stderr(`  ${command}`);
    return false;
  }
  return true;
}

/** The main source file of an item: "<name>.tsx" if present, else its first script file. */
function mainFile(item: RegistryItem) {
  return (
    item.files.find((f) => /^[^/\\]+\.(tsx|ts|jsx|js)$/.test(f.target) && f.target.startsWith(`${item.name}.`)) ??
    item.files.find((f) => /\.(tsx|ts|jsx|js)$/.test(f.target))
  );
}

export async function runAdd(args: ParsedArgs, ctx: Context): Promise<number> {
  const registry = args.registry ?? DEFAULT_REGISTRY;
  const dir = path.resolve(ctx.cwd, args.dir ?? defaultDir(ctx.cwd));
  const themePath = path.join(dir, THEME_FILE);
  const firstRun = !existsSync(themePath);
  assertCssExists(args, ctx);

  const requested = new Set(args.names);
  let items = await resolveItems(args.names, (name) => fetchItem(registry, name, ctx.cwd));
  if (firstRun && !items.some((i) => i.name === THEME_ITEM)) {
    const theme = await fetchTheme(registry, ctx.cwd);
    if (theme) items.unshift(theme);
  }
  // Once the theme is in place, leave it alone unless asked for (keeps the output short).
  if (!firstRun && !args.overwrite) items = items.filter((i) => i.name !== THEME_ITEM || requested.has(i.name));

  const extra = items.filter((i) => !requested.has(i.name)).map((i) => i.name);
  ctx.stdout(`Adding ${args.names.join(", ")}${extra.length ? ` (+ ${extra.join(", ")})` : ""}`);
  printWrites(ctx, await writeItems(items, dir, { overwrite: args.overwrite }));

  if (existsSync(themePath)) wireTheme(args, ctx, themePath, { verbose: false, hint: firstRun || !!args.css });
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
  const entries = await fetchIndex(args.registry ?? DEFAULT_REGISTRY, ctx.cwd);
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
        ctx.stdout(HELP);
        return 0;
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
