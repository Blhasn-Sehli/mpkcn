import { parseArgs } from "node:util";
import { CliError } from "./errors.js";

export type Command = "add" | "list" | "help" | "version";

export type ParsedArgs = {
  command: Command;
  names: string[];
  dir?: string;
  registry?: string;
  overwrite: boolean;
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
        overwrite: { type: "boolean", short: "o", default: false },
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
    overwrite: values.overwrite ?? false,
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
  if (first === "list") return { command: "list", names: [], ...base };
  throw new CliError(`Unknown command "${first}".`);
}

export const HELP = `mpkcn - add terminal-style React components to your project

Usage
  mpkcn add <name...> [options]   Copy components (and what they need) into your project
  mpkcn list [options]            Show available components

Options
  -d, --dir <path>        Target folder (default: src/components/mpkcn, or components/mpkcn without src/)
  -r, --registry <url>    Registry URL or local folder (default: https://blhasn-sehli.github.io/mpkcn/r)
  -o, --overwrite         Replace files that already exist
  -y, --yes               Non-interactive (mpkcn never prompts; accepted for scripts)
  -h, --help              Show this help
  -v, --version           Show the version

Examples
  npx mpkcn add boot-screen
  npx mpkcn add reveal theme-toggle --dir app/ui

Docs: https://blhasn-sehli.github.io/mpkcn`;
