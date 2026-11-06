import { parseArgs } from "node:util";
import { CliError } from "./errors.js";

export type Command = "add" | "init" | "list" | "help" | "version";

export type ParsedArgs = {
  command: Command;
  names: string[];
  dir?: string;
  registry?: string;
  css?: string;
  overwrite: boolean;
  install: boolean;
  yes: boolean;
};

/** Parses argv (without the node binary and script path). Throws CliError on bad input. */
export function parseCli(argv: string[]): ParsedArgs {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        dir: { type: "string", short: "d" },
        registry: { type: "string", short: "r" },
        css: { type: "string", short: "c" },
        overwrite: { type: "boolean", short: "o", default: false },
        "no-install": { type: "boolean", default: false },
        yes: { type: "boolean", short: "y", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (err) {
    throw new CliError((err as Error).message);
  }

  const { values, positionals } = parsed;
  const base = {
    dir: values.dir,
    registry: values.registry,
    css: values.css,
    overwrite: values.overwrite ?? false,
    install: !(values["no-install"] ?? false),
    yes: values.yes ?? false,
  };

  if (values.version) return { command: "version", names: [], ...base };
  const [first, ...rest] = positionals;
  if (values.help || first === undefined || first === "help") {
    return { command: "help", names: [], ...base };
  }
  if (first === "add") {
    if (rest.length === 0) throw new CliError("Missing component name. Usage: mpkcn add <name...>");
    return { command: "add", names: rest, ...base };
  }
  if (first === "init") {
    if (rest.length > 0) throw new CliError(`"init" takes no names. To add components: mpkcn add ${rest.join(" ")}`);
    return { command: "init", names: [], ...base };
  }
  if (first === "list") return { command: "list", names: [], ...base };
  throw new CliError(`Unknown command "${first}".`);
}

export const HELP = `mpkcn - add terminal-style React components to your project

Usage
  mpkcn init [options]            Set up the theme, the CSS import, and check your project
  mpkcn add <name...> [options]   Add components, install their npm packages, wire the theme
  mpkcn list [options]            Show available components

Options
  -d, --dir <path>        Target folder (default: src/components/mpkcn, or components/mpkcn without src/)
  -c, --css <path>        Global CSS file to import the theme into (default: auto-detected)
  -r, --registry <url>    Registry URL or local folder (default: https://blhasn-sehli.github.io/mpkcn/r)
  -o, --overwrite         Replace files that already exist
      --no-install        Do not install npm packages, only print the command
  -y, --yes               Non-interactive (mpkcn never prompts; accepted for scripts)
  -h, --help              Show this help
  -v, --version           Show the version

Examples
  npx mpkcn init
  npx mpkcn add boot-screen
  npx mpkcn add reveal theme-toggle --dir app/ui

Docs: https://blhasn-sehli.github.io/mpkcn`;
