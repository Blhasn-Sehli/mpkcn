// `mpkcn mcp`: the CLI as a Model Context Protocol server, so AI assistants (Claude Code,
// Cursor, VS Code, Windsurf, Claude Desktop) can find components and add them to a project.
//
// Hand-written on purpose: MCP over stdio is newline-delimited JSON-RPC 2.0, and the four
// methods we need (initialize, ping, tools/list, tools/call) fit in one file. That keeps
// the CLI at zero runtime dependencies, so `npx mpkcn add` stays fast.
//
// Rules: stdout carries protocol messages only (logs and package-manager output go to
// stderr), and every failure inside a tool comes back as a tool error, never a crash.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { ParsedArgs } from "./args.js";
import { emptyReport, getVersion, mainFile, runAdd, runInit, type Context, type Report } from "./cli.js";
import { CliError } from "./errors.js";
import { pipedRunner, type Runner } from "./install.js";
import { detectPackageManager } from "./pm.js";
import { exportedName, readPackageJson } from "./project.js";
import { fetchIndex, fetchItem, isRemote, isValidName, registryFrom } from "./registry.js";

/** Protocol versions this server speaks, newest first. */
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

const SITE = "https://blhasn-sehli.github.io/mpkcn";
const SETUP_ITEMS = new Set(["theme", "theme-provider"]);

const INSTRUCTIONS = `mpkcn is a terminal-style React UI kit (React 19, Tailwind CSS 4, Next.js friendly). Like shadcn, components are copied into the user's project as source, not installed as a package.

Workflow:
1. list_components (with a query such as "status bar" or "loader") to find a fitting component.
2. get_component to read its source, props and usage before you decide or explain.
3. add_components with cwd set to the absolute path of the project root (the folder with package.json). It writes the files, imports the theme in the global CSS, wires the Next.js root layout (fonts, theme provider) and installs npm packages, then returns the import lines.
4. Use the returned import line in the user's page.

add_components and init_project write files and may run the package manager: only call them when the user asked to add or set up something.`;

// ---------------------------------------------------------------------------
// JSON-RPC

type Id = string | number;
type JsonObject = Record<string, unknown>;
type Response = { jsonrpc: "2.0"; id: Id | null } & ({ result: unknown } | { error: { code: number; message: string } });

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

const isObject = (v: unknown): v is JsonObject => typeof v === "object" && v !== null && !Array.isArray(v);
const ok = (id: Id, result: unknown): Response => ({ jsonrpc: "2.0", id, result });
const fail = (id: Id | null, code: number, message: string): Response => ({ jsonrpc: "2.0", id, error: { code, message } });

// ---------------------------------------------------------------------------
// Tools

type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: JsonObject;
  isError?: boolean;
};

type PropSchema =
  | { type: "string"; description: string; maxLength?: number }
  | { type: "boolean"; description: string; default?: boolean }
  | { type: "array"; description: string; items: { type: "string"; pattern?: string }; minItems?: number; maxItems?: number };

type InputSchema = {
  type: "object";
  properties: Record<string, PropSchema>;
  required?: string[];
  additionalProperties: false;
};

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: InputSchema;
  annotations: { readOnlyHint: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint: boolean };
  run: (args: JsonObject) => Promise<ToolResult>;
};

/** Checks arguments against the (small) subset of JSON Schema the tools use. Returns the problem, if any. */
export function validateArgs(schema: InputSchema, args: JsonObject): string | undefined {
  for (const key of schema.required ?? []) {
    if (args[key] === undefined) return `Missing required argument "${key}".`;
  }
  for (const [key, value] of Object.entries(args)) {
    const prop = schema.properties[key];
    if (!prop) return `Unknown argument "${key}". Allowed: ${Object.keys(schema.properties).join(", ")}.`;
    if (value === undefined) continue;
    if (prop.type === "string") {
      if (typeof value !== "string") return `"${key}" must be a string.`;
      if (prop.maxLength !== undefined && value.length > prop.maxLength) return `"${key}" is too long.`;
    } else if (prop.type === "boolean") {
      if (typeof value !== "boolean") return `"${key}" must be true or false.`;
    } else {
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) return `"${key}" must be an array of strings.`;
      if (prop.minItems !== undefined && value.length < prop.minItems) return `"${key}" needs at least ${prop.minItems} item(s).`;
      if (prop.maxItems !== undefined && value.length > prop.maxItems) return `"${key}" takes at most ${prop.maxItems} items.`;
    }
  }
  return undefined;
}

const structured = (data: JsonObject, isError = false): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
  ...(isError ? { isError: true } : {}),
});
const toolError = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

export type McpServerOptions = {
  /** Registry URL or absolute local folder. */
  registry: string;
  /** Default project folder for add_components / init_project. */
  cwd: string;
  /** Runs the package manager. Defaults to a child process whose output goes to stderr. */
  exec?: Runner;
  /** Diagnostics (stderr). */
  log?: (message: string) => void;
};

export type McpServer = {
  /** Handles one decoded JSON-RPC message; resolves to the response, or undefined for notifications. */
  handle: (message: unknown) => Promise<Response | undefined>;
  tools: Tool[];
};

export function createMcpServer(opts: McpServerOptions): McpServer {
  const { registry } = opts;
  const log = opts.log ?? (() => {});
  const exec = opts.exec ?? pipedRunner((chunk) => process.stderr.write(chunk));
  const version = getVersion();

  // add / init change files: run them one at a time.
  let queue: Promise<unknown> = Promise.resolve();
  const exclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(fn, fn);
    queue = next.catch(() => {});
    return next;
  };

  /** The project folder: an existing directory with a package.json. */
  const projectDir = (cwd: unknown): string => {
    const dir = path.resolve(opts.cwd, typeof cwd === "string" && cwd ? cwd : ".");
    if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new CliError(`Project folder not found: ${dir}`);
    if (!readPackageJson(dir)) {
      throw new CliError(
        `No package.json in ${dir}. Pass "cwd" as the absolute path of the project root (the folder that has package.json).`,
      );
    }
    return dir;
  };

  /** --dir for add: must stay inside the project. */
  const componentsDir = (project: string, dir: unknown): string | undefined => {
    if (typeof dir !== "string" || !dir) return undefined;
    const full = path.resolve(project, dir);
    const rel = path.relative(project, full);
    if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new CliError(`"dir" must be a folder inside the project, got "${dir}".`);
    }
    return rel;
  };

  const baseArgs = (command: "add" | "init", names: string[], a: JsonObject, dir?: string): ParsedArgs => ({
    command,
    names,
    dir,
    registry,
    overwrite: a.overwrite === true,
    install: a.install !== false,
    layout: a.layout !== false,
    fonts: true,
    yes: true,
  });

  /** Runs add / init with output captured, and shapes the result for the model. */
  const runCommand = async (
    project: string,
    fn: (args: ParsedArgs, ctx: Context) => Promise<number>,
    args: ParsedArgs,
  ): Promise<{ code: number; report: Report; output: string; packageManager: string }> => {
    const lines: string[] = [];
    const report = emptyReport();
    const ctx: Context = {
      cwd: project,
      stdout: (l) => lines.push(l),
      stderr: (l) => lines.push(l),
      exec,
      report,
    };
    const code = await fn(args, ctx);
    return { code, report, output: lines.join("\n").trim(), packageManager: detectPackageManager(project) };
  };

  const dependencySummary = (r: Report, install: boolean) => ({
    installed: r.installed,
    alreadyInPackageJson: r.alreadyInstalled,
    ...(r.installCommand ? { command: r.installCommand } : {}),
    status: r.installFailed
      ? "failed: run the command yourself"
      : r.installCommand && !install
        ? "not installed (install: false): run the command"
        : r.installed.length
          ? "installed"
          : "nothing to install",
  });

  const warningsOf = (r: Report) => [
    ...r.checks.filter((c) => !c.ok).map((c) => c.message),
    ...(r.installFailed ? [`The install failed. The files are in place; run: ${r.installCommand}`] : []),
  ];

  const nameList: PropSchema = {
    type: "array",
    description: 'Component names from list_components, e.g. ["boot-screen"] or ["theme-toggle", "reveal"].',
    items: { type: "string", pattern: "^[a-z0-9-]+$" },
    minItems: 1,
    maxItems: 50,
  };
  const cwdProp: PropSchema = {
    type: "string",
    maxLength: 4096,
    description:
      "Absolute path of the project root, the folder with package.json. Defaults to the folder the server runs in; always pass it when you know the project path.",
  };

  const tools: Tool[] = [
    {
      name: "list_components",
      title: "List mpkcn components",
      description:
        "List the mpkcn components (terminal-style React UI: boot screen, terminal window, tmux status bar, command palette, theme toggle, scroll effects...). Returns name, title, one-line description, category, npm dependencies and registry dependencies for each. Pass a query to filter, e.g. \"status bar\", \"loader\", \"dark mode\" or \"scroll\". Items in the \"Setup\" category (theme, theme-provider) are added automatically and rarely need to be requested.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", maxLength: 200, description: "Optional words to match against the name, title, description and category." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      run: async (a) => {
        let entries = await fetchIndex(registry, opts.cwd);
        // Older registries only list name, title and description: read the deps from each item.
        if (entries.some((e) => !e.dependencies || !e.registryDependencies)) {
          entries = await Promise.all(
            entries.map(async (e) => {
              if (e.dependencies && e.registryDependencies) return e;
              try {
                const item = await fetchItem(registry, e.name, opts.cwd);
                return {
                  ...e,
                  category: e.category ?? item.category,
                  dependencies: item.dependencies,
                  registryDependencies: item.registryDependencies,
                };
              } catch {
                return e;
              }
            }),
          );
        }
        const all = entries.map((e) => ({
          name: e.name,
          title: e.title,
          description: e.description,
          category: e.category ?? (SETUP_ITEMS.has(e.name) ? "Setup" : "Other"),
          dependencies: e.dependencies ?? [],
          registryDependencies: e.registryDependencies ?? [],
        }));
        const query = typeof a.query === "string" ? a.query.trim() : "";
        const components = query ? search(all, query) : all;
        return structured({
          count: components.length,
          ...(query ? { query } : {}),
          components,
          next: components.length
            ? "Call get_component for the source and usage, or add_components to add it to the project."
            : "Nothing matched. Call list_components without a query to see everything.",
        });
      },
    },
    {
      name: "get_component",
      title: "Get an mpkcn component",
      description:
        "Get one mpkcn component: its full source files, npm dependencies, registry dependencies (other mpkcn items it pulls in), the import line, a short usage example and the docs URL. Use it to check the props and behaviour before adding the component or explaining it. Read-only: it does not change the project.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", maxLength: 100, description: 'Component name from list_components, e.g. "boot-screen".' } },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      run: async (a) => {
        const name = a.name as string;
        if (!isValidName(name)) return toolError(`Invalid component name "${name}". Names use a-z, 0-9 and "-" only.`);
        const item = await fetchItem(registry, name, opts.cwd);
        const main = mainFile(item);
        const importLine = main
          ? `import { ${exportedName(main.content, item.name)} } from "@/components/mpkcn/${main.target.replace(/\.(tsx|ts|jsx|js)$/, "")}";`
          : undefined;
        return structured({
          name: item.name,
          title: item.title,
          description: item.description,
          category: item.category ?? (SETUP_ITEMS.has(item.name) ? "Setup" : "Other"),
          dependencies: item.dependencies,
          registryDependencies: item.registryDependencies,
          install: `npx mpkcn add ${item.name}`,
          ...(importLine
            ? {
                import: importLine,
                importNote:
                  "Assumes the default folder and the @/ alias. add_components returns the exact line for the project.",
              }
            : {}),
          ...(item.usage ? { usage: item.usage } : {}),
          docs: item.docs ?? docsUrl(item.name),
          files: item.files.map((f) => ({ path: f.target, content: f.content })),
        });
      },
    },
    {
      name: "add_components",
      title: "Add mpkcn components to the project",
      description:
        "Add mpkcn components to a project, exactly like `npx mpkcn add <names>`: writes the source files (default src/components/mpkcn, or components/mpkcn without src/) plus the items they depend on, imports the theme in the global CSS, wires the Next.js root layout (fonts and theme provider) when it has the standard shape, and installs missing npm packages with the project's package manager. Existing files are skipped unless overwrite is true. Returns the files created or updated, the dependencies installed, the import lines to use, manual steps for edits it could not make, and warnings. Only call it when the user asked to add something.",
      inputSchema: {
        type: "object",
        properties: {
          names: nameList,
          cwd: cwdProp,
          overwrite: { type: "boolean", default: false, description: "Replace files that already exist. Default false: existing files are kept." },
          install: { type: "boolean", default: true, description: "Install missing npm packages. false returns the install command instead." },
          layout: { type: "boolean", default: true, description: "Edit the root layout (fonts, theme provider). false returns the lines to add instead." },
          dir: { type: "string", maxLength: 1024, description: "Components folder relative to the project root. Default src/components/mpkcn (or components/mpkcn)." },
        },
        required: ["names"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      run: (a) =>
        exclusive(async () => {
          const names = a.names as string[];
          const bad = names.filter((n) => !isValidName(n));
          if (bad.length) {
            return toolError(`Invalid component name(s): ${bad.map((n) => JSON.stringify(n)).join(", ")}. Names use a-z, 0-9 and "-" only; see list_components.`);
          }
          const project = projectDir(a.cwd);
          const dir = componentsDir(project, a.dir);
          const install = a.install !== false;
          const { code, report, output, packageManager } = await runCommand(project, runAdd, baseArgs("add", names, a, dir));
          return structured(
            {
              ok: code === 0,
              project,
              packageManager,
              requested: names,
              files: report.files,
              dependencies: dependencySummary(report, install),
              imports: report.imports,
              manualSteps: report.manualSteps,
              warnings: warningsOf(report),
              output,
            },
            code !== 0,
          );
        }),
    },
    {
      name: "init_project",
      title: "Set up mpkcn in the project",
      description:
        "Set up mpkcn in a project, exactly like `npx mpkcn init`: writes the theme (mpkcn-theme.css), imports it in the global CSS, and in a Next.js app writes the theme provider, loads the fonts in the root layout and installs next-themes. Then checks React 19, Tailwind CSS 4, next-themes, the provider and the fonts. Optional: add_components does the same setup on its first run. Only call it when the user asked to set up mpkcn.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: cwdProp,
          install: { type: "boolean", default: true, description: "Install missing npm packages. false returns the install command instead." },
          layout: { type: "boolean", default: true, description: "Edit the root layout (fonts, theme provider). false returns the lines to add instead." },
          overwrite: { type: "boolean", default: false, description: "Replace the theme and provider files if they already exist." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      run: (a) =>
        exclusive(async () => {
          const project = projectDir(a.cwd);
          const install = a.install !== false;
          const { code, report, output, packageManager } = await runCommand(project, runInit, baseArgs("init", [], a));
          return structured(
            {
              ok: code === 0,
              project,
              packageManager,
              files: report.files,
              checks: report.checks,
              dependencies: dependencySummary(report, install),
              manualSteps: report.manualSteps,
              warnings: warningsOf(report),
              output,
            },
            code !== 0,
          );
        }),
    },
  ];

  const callTool = async (params: JsonObject): Promise<ToolResult> => {
    const tool = tools.find((t) => t.name === params.name)!;
    const args = params.arguments === undefined ? {} : params.arguments;
    if (!isObject(args)) return toolError("Tool arguments must be an object.");
    const problem = validateArgs(tool.inputSchema, args);
    if (problem) return toolError(problem);
    try {
      return await tool.run(args);
    } catch (err) {
      if (err instanceof CliError) return toolError(err.message);
      log(`${tool.name} failed: ${(err as Error).stack ?? String(err)}`);
      return toolError(`Unexpected error in ${tool.name}: ${(err as Error).message ?? String(err)}`);
    }
  };

  const handle = async (message: unknown): Promise<Response | undefined> => {
    if (Array.isArray(message)) return fail(null, INVALID_REQUEST, "JSON-RPC batches are not supported.");
    if (!isObject(message) || message.jsonrpc !== "2.0") return fail(null, INVALID_REQUEST, "Invalid Request: expected a JSON-RPC 2.0 object.");
    const { id, method } = message;
    const hasId = typeof id === "string" || typeof id === "number";
    if ("id" in message && !hasId) return fail(null, INVALID_REQUEST, "Invalid Request: id must be a string or a number.");

    if (typeof method !== "string") {
      // A response to a request we sent (we send none): ignore it.
      if (hasId && ("result" in message || "error" in message)) return undefined;
      return fail(hasId ? id : null, INVALID_REQUEST, "Invalid Request: missing method.");
    }
    // Notifications (initialized, cancelled, ...) need no answer.
    if (!hasId) return undefined;

    const params = message.params === undefined ? {} : message.params;
    if (!isObject(params)) return fail(id, INVALID_PARAMS, "params must be an object.");

    try {
      switch (method) {
        case "initialize": {
          const requested = params.protocolVersion;
          if (typeof requested !== "string") return fail(id, INVALID_PARAMS, "initialize needs a protocolVersion string.");
          const protocolVersion = (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
            ? requested
            : LATEST_PROTOCOL_VERSION;
          const client = isObject(params.clientInfo) ? `${params.clientInfo.name ?? "?"} ${params.clientInfo.version ?? ""}` : "unknown";
          log(`client ${client.trim()} connected (protocol ${protocolVersion})`);
          return ok(id, {
            protocolVersion,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: "mpkcn", title: "mpkcn", version, websiteUrl: SITE },
            instructions: INSTRUCTIONS,
          });
        }
        case "ping":
          return ok(id, {});
        case "tools/list":
          return ok(id, {
            tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({
              name,
              title,
              description,
              inputSchema,
              annotations,
            })),
          });
        case "tools/call": {
          if (typeof params.name !== "string") return fail(id, INVALID_PARAMS, "tools/call needs a tool name.");
          if (!tools.some((t) => t.name === params.name)) return fail(id, INVALID_PARAMS, `Unknown tool: ${params.name}`);
          return ok(id, await callTool(params));
        }
        default:
          return fail(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
      }
    } catch (err) {
      log(`${method} failed: ${(err as Error).stack ?? String(err)}`);
      return fail(id, INTERNAL_ERROR, `Internal error: ${(err as Error).message ?? String(err)}`);
    }
  };

  return { handle, tools };
}

type Listed = { name: string; title: string; description: string; category: string };

/** Every query word must match; if nothing does, fall back to items matching any word, best first. */
function search<T extends Listed>(items: T[], query: string): T[] {
  const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const hay = (i: T) => `${i.name} ${i.title} ${i.description} ${i.category}`.toLowerCase().replace(/[-_]/g, " ");
  const score = (i: T) => words.filter((w) => hay(i).includes(w)).length;
  const all = items.filter((i) => score(i) === words.length);
  if (all.length) return all;
  return items
    .map((item) => ({ item, s: score(item) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item);
}

function docsUrl(name: string): string {
  if (name === "theme") return `${SITE}/docs/theming/`;
  if (name === "theme-provider") return `${SITE}/docs/installation/`;
  return `${SITE}/docs/components/${name}/`;
}

/**
 * Serves `server` over newline-delimited JSON-RPC: one message per line on `input`,
 * one per line on `output`. Requests run concurrently (ping answers while an install
 * runs). Resolves once `input` ends and every pending reply is written.
 */
export function serveStdio(server: McpServer, input: Readable, output: Writable, log: (m: string) => void = () => {}): Promise<void> {
  const rl = createInterface({ input, crlfDelay: Infinity });
  const pending = new Set<Promise<void>>();
  const send = (message: Response) => {
    if (!output.writable) return;
    output.write(`${JSON.stringify(message)}\n`);
  };
  output.on("error", (err) => log(`output closed: ${err.message}`));

  rl.on("line", (line) => {
    if (!line.trim()) return;
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      send(fail(null, PARSE_ERROR, "Parse error: each line must be one JSON-RPC message."));
      return;
    }
    const task = server
      .handle(message)
      .then((response) => {
        if (response) send(response);
      })
      .catch((err: unknown) => {
        log(`unhandled: ${(err as Error).stack ?? String(err)}`);
        const id = isObject(message) && (typeof message.id === "string" || typeof message.id === "number") ? message.id : null;
        if (id !== null) send(fail(id, INTERNAL_ERROR, "Internal error."));
      });
    pending.add(task);
    void task.finally(() => pending.delete(task));
  });

  return new Promise((resolve) => {
    rl.on("close", () => {
      void Promise.allSettled([...pending]).then(() => resolve());
    });
  });
}

/** `mpkcn mcp`: serves the tools on stdin / stdout until the client closes stdin. */
export async function runMcp(args: ParsedArgs, ctx: Context): Promise<number> {
  const log = (m: string) => process.stderr.write(`[mpkcn] ${m}\n`);
  // stdout is the protocol channel: anything that would print there goes to stderr.
  console.log = console.info = console.debug = (...a: unknown[]) => console.error(...a);

  let registry = registryFrom(args.registry);
  if (!isRemote(registry)) registry = path.resolve(ctx.cwd, registry);
  const server = createMcpServer({ registry, cwd: ctx.cwd, exec: ctx.exec, log });
  log(`mpkcn ${getVersion()} MCP server on stdio (registry: ${registry})`);
  await serveStdio(server, process.stdin, process.stdout, log);
  return 0;
}
