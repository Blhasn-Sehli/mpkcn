import { parseArgs } from "node:util";
import { CliError } from "./errors.js";

export type Command = "add" | "init" | "list" | "mcp" | "help" | "version";

export type ParsedArgs = {
  command: Command;
  names: string[];
  dir?: string;
  registry?: string;
  css?: string;
  overwrite: boolean;
  install: boolean;
  /** Edit the root layout (theme provider, fonts). */
  layout: boolean;
  /** Load the fonts (next/font in the layout, or print a Google Fonts @import). */
  fonts: boolean;
  yes: boolean;
  /** Help topic: "mcp" for `mpkcn mcp --help`. */
  topic?: "mcp";
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
        "no-layout": { type: "boolean", default: false },
        "no-fonts": { type: "boolean", default: false },
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
    layout: !(values["no-layout"] ?? false),
    fonts: !(values["no-fonts"] ?? false),
    yes: values.yes ?? false,
  };

  if (values.version) return { command: "version", names: [], ...base };
  const [first, ...rest] = positionals;
  if (first === "mcp") {
    if (values.help) return { command: "help", names: [], ...base, topic: "mcp" };
    if (rest.length > 0) throw new CliError(`"mcp" takes no names. Usage: mpkcn mcp [--registry <url>]`);
    return { command: "mcp", names: [], ...base };
  }
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
  mpkcn init [options]            Set up the theme, fonts and theme provider, check your project
  mpkcn add <name...> [options]   Add components, install their npm packages, wire everything up
  mpkcn list [options]            Show available components
  mpkcn mcp [--registry <url>]    Run the MCP server for AI assistants (mpkcn mcp --help)

Options
  -d, --dir <path>        Target folder (default: src/components/mpkcn, or components/mpkcn without src/)
  -c, --css <path>        Global CSS file to import the theme into (default: auto-detected)
  -r, --registry <url>    Registry URL or local folder (default: $MPKCN_REGISTRY, else https://blhasn-sehli.github.io/mpkcn/r)
  -o, --overwrite         Replace files that already exist
      --no-install        Do not install npm packages, only print the command
      --no-layout         Do not edit the root layout, print the lines to add instead
      --no-fonts          Do not load the fonts
  -y, --yes               Non-interactive (mpkcn never prompts; accepted for scripts)
  -h, --help              Show this help
  -v, --version           Show the version

Examples
  npx mpkcn init
  npx mpkcn add boot-screen
  npx mpkcn add reveal theme-toggle --dir app/ui
  claude mcp add mpkcn -- npx -y mpkcn@latest mcp

Docs: https://blhasn-sehli.github.io/mpkcn`;

export const MCP_HELP = `mpkcn mcp - the mpkcn MCP server, for AI assistants

Lets Claude Code, Cursor, VS Code, Windsurf or Claude Desktop find mpkcn components
and add them to your project ("add a boot screen to my landing page"). It speaks MCP
over stdio: your assistant starts it, you never run it by hand.

Tools
  list_components   Search the components (name, title, description, category, deps)
  get_component     Full source, npm and registry deps, import line, usage, docs link
  add_components    Same as mpkcn add: write files, wire CSS and layout, install deps
  init_project      Same as mpkcn init: theme, fonts, provider, project checks

Set it up

  Claude Code
    claude mcp add mpkcn -- npx -y mpkcn@latest mcp

  Cursor: .cursor/mcp.json in your project (or ~/.cursor/mcp.json)
    {
      "mcpServers": {
        "mpkcn": { "type": "stdio", "command": "npx", "args": ["-y", "mpkcn@latest", "mcp"] }
      }
    }

  VS Code: .vscode/mcp.json in your project
    {
      "servers": {
        "mpkcn": { "type": "stdio", "command": "npx", "args": ["-y", "mpkcn@latest", "mcp"] }
      }
    }
    or: code --add-mcp '{"name":"mpkcn","type":"stdio","command":"npx","args":["-y","mpkcn@latest","mcp"]}'

  Windsurf (~/.codeium/windsurf/mcp_config.json) and Claude Desktop
  (claude_desktop_config.json, Settings > Developer > Edit Config)
    {
      "mcpServers": {
        "mpkcn": { "command": "npx", "args": ["-y", "mpkcn@latest", "mcp"] }
      }
    }

  On Windows, if the server does not start, use "command": "cmd" with
  "args": ["/c", "npx", "-y", "mpkcn@latest", "mcp"].

Options
  -r, --registry <url>    Registry URL or local folder (default: $MPKCN_REGISTRY, else the mpkcn site)

Safety: the server only writes files and runs your package manager when the assistant
calls add_components or init_project, in the project folder it names (it must have a
package.json). File targets that leave the components folder are rejected.

Docs: https://blhasn-sehli.github.io/mpkcn/docs/ai/`;
