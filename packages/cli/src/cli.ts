import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { HELP, parseCli, type ParsedArgs } from "./args.js";
import { CliError } from "./errors.js";
import { detectPackageManager, installCommand } from "./pm.js";
import { DEFAULT_REGISTRY, fetchIndex, fetchItem } from "./registry.js";
import { collectDependencies, resolveItems } from "./resolve.js";
import { writeItems } from "./write.js";

export type Context = {
  cwd: string;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
};

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

export async function runAdd(args: ParsedArgs, ctx: Context): Promise<void> {
  const registry = args.registry ?? DEFAULT_REGISTRY;
  const dir = path.resolve(ctx.cwd, args.dir ?? defaultDir(ctx.cwd));

  const items = await resolveItems(args.names, (name) => fetchItem(registry, name, ctx.cwd));
  const requested = new Set(args.names);
  const extra = items.filter((i) => !requested.has(i.name)).map((i) => i.name);
  ctx.stdout(`Adding ${args.names.join(", ")}${extra.length ? ` (+ ${extra.join(", ")})` : ""}`);

  const results = await writeItems(items, dir, { overwrite: args.overwrite });
  for (const r of results) {
    const note = r.status === "skipped" ? "  (exists, use --overwrite to replace)" : "";
    ctx.stdout(`  ${r.status.padEnd(11)} ${toDisplay(ctx.cwd, r.path)}${note}`);
  }

  const deps = collectDependencies(items);
  if (deps.length) {
    ctx.stdout("");
    ctx.stdout("Install the npm dependencies:");
    ctx.stdout(`  ${installCommand(detectPackageManager(ctx.cwd), deps)}`);
  }

  const theme = items.find((i) => i.name === "theme");
  const themeFile = theme?.files.find((f) => f.target.endsWith(".css"));
  if (themeFile) {
    ctx.stdout("");
    ctx.stdout("Tip: import the theme once in your global CSS (path relative to that file):");
    ctx.stdout(`  @import "${toDisplay(ctx.cwd, path.resolve(dir, themeFile.target))}";`);
  }
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
      case "add":
        await runAdd(args, ctx);
        return 0;
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
