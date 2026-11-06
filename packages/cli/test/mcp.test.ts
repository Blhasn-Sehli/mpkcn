// Drives `mpkcn mcp` as a real child process over stdio: raw JSON-RPC lines first,
// then the official MCP SDK client as an interop check.
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/cli.js";
import { validateArgs } from "../src/mcp.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CLI = path.join(ROOT, "dist", "index.js");
const REGISTRY = path.join(HERE, "fixtures", "r");

// The tests run the built CLI, so build it first.
beforeAll(() => {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.build.json"], { cwd: ROOT, stdio: "inherit" });
}, 120_000);

let cwd: string;
beforeEach(async () => {
  cwd = await mkdtemp(path.join(os.tmpdir(), "mpkcn-mcp-"));
});
afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

const write = async (rel: string, text: string) => {
  await mkdir(path.dirname(path.join(cwd, rel)), { recursive: true });
  await writeFile(path.join(cwd, rel), text);
};

const LAYOUT = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

/** A small Next.js app: package.json, the @/ alias, globals.css and a root layout. */
async function nextApp() {
  await write(
    "package.json",
    JSON.stringify({ name: "app", dependencies: { next: "16.4.5", react: "19.3.0", "react-dom": "19.3.0", "next-themes": "0.4.6" }, devDependencies: { tailwindcss: "^4" } }),
  );
  await write("tsconfig.json", '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }');
  await write("src/app/globals.css", '@import "tailwindcss";\n');
  await write("src/app/layout.tsx", LAYOUT);
}

type Message = { jsonrpc: "2.0"; id?: number | string | null; result?: any; error?: { code: number; message: string } };

/** Minimal line-based JSON-RPC client over the server's stdin / stdout. */
function startServer(dir: string) {
  const child: ChildProcessWithoutNullStreams = spawn(process.execPath, [CLI, "mcp", "--registry", REGISTRY], {
    cwd: dir,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines: string[] = [];
  const received: Message[] = [];
  const waiters: ((m: Message) => void)[] = [];
  let stderr = "";
  let buf = "";
  child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
  child.stdout.on("data", (d: Buffer) => {
    buf += d.toString();
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      lines.push(line);
      const msg = JSON.parse(line) as Message; // every stdout line must be JSON
      received.push(msg);
      waiters.shift()?.(msg);
    }
  });
  let nextId = 1;
  const next = () => new Promise<Message>((resolve) => waiters.push(resolve));
  const raw = (line: string) => {
    const p = next();
    child.stdin.write(`${line}\n`);
    return p;
  };
  const request = (method: string, params?: unknown) =>
    raw(JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, ...(params === undefined ? {} : { params }) }));
  const notify = (method: string) => child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`);
  const call = async (name: string, args: unknown) => (await request("tools/call", { name, arguments: args })).result;
  const close = () =>
    new Promise<number | null>((resolve) => {
      child.on("exit", (code) => resolve(code));
      child.stdin.end();
    });
  const init = () =>
    request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  return { request, raw, notify, call, close, init, lines, received, stderr: () => stderr };
}

describe("mcp over stdio (raw JSON-RPC)", () => {
  it("initializes, negotiates the protocol version and answers ping", async () => {
    const s = startServer(cwd);
    const init = await s.init();
    expect(init.result.protocolVersion).toBe("2025-06-18");
    expect(init.result.serverInfo).toMatchObject({ name: "mpkcn", version: expect.stringMatching(/^\d+\.\d+\.\d+$/) });
    expect(init.result.capabilities).toEqual({ tools: { listChanged: false } });
    expect(init.result.instructions).toContain("add_components");

    // The initialized notification gets no reply: the next message is the ping's.
    s.notify("notifications/initialized");
    const ping = await s.request("ping");
    expect(ping).toEqual({ jsonrpc: "2.0", id: 2, result: {} });

    const future = await s.request("initialize", { protocolVersion: "2099-01-01", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    expect(future.result.protocolVersion).toBe("2025-11-25");

    expect(await s.close()).toBe(0);
    expect(s.stderr()).toContain("MCP server on stdio");
  });

  it("lists the four tools with object input schemas", async () => {
    const s = startServer(cwd);
    await s.init();
    const { result } = await s.request("tools/list");
    expect(result.tools.map((t: { name: string }) => t.name)).toEqual([
      "list_components",
      "get_component",
      "add_components",
      "init_project",
    ]);
    for (const t of result.tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.description.length).toBeGreaterThan(80);
    }
    expect(result.tools[0].annotations.readOnlyHint).toBe(true);
    expect(result.tools[2].annotations.readOnlyHint).toBe(false);
    await s.close();
  });

  it("list_components reads the fixture registry, with deps and a query filter", async () => {
    const s = startServer(cwd);
    await s.init();
    const all = await s.call("list_components", {});
    expect(all.isError).toBeUndefined();
    expect(all.structuredContent.count).toBe(4);
    const card = all.structuredContent.components.find((c: { name: string }) => c.name === "card");
    expect(card).toEqual({
      name: "card",
      title: "Card",
      description: "A hairline card that uses the button.",
      category: "Other",
      dependencies: ["clsx", "framer-motion"],
      registryDependencies: ["button", "theme"],
    });
    expect(all.structuredContent.components[0].category).toBe("Setup");
    expect(JSON.parse(all.content[0].text)).toEqual(all.structuredContent);

    const hit = await s.call("list_components", { query: "hairline" });
    expect(hit.structuredContent.components.map((c: { name: string }) => c.name)).toEqual(["card"]);
    await s.close();
  });

  it("get_component returns the source, deps, import line and docs URL", async () => {
    const s = startServer(cwd);
    await s.init();
    const res = await s.call("get_component", { name: "card" });
    expect(res.isError).toBeUndefined();
    expect(res.structuredContent).toMatchObject({
      name: "card",
      dependencies: ["clsx", "framer-motion"],
      registryDependencies: ["button", "theme"],
      install: "npx mpkcn add card",
      import: 'import { Card } from "@/components/mpkcn/card";',
      docs: "https://blhasn-sehli.github.io/mpkcn/docs/components/card/",
    });
    expect(res.structuredContent.files.map((f: { path: string }) => f.path)).toEqual(["card.tsx", "lib/card-utils.ts"]);
    expect(res.structuredContent.files[0].content).toContain("export function Card");

    const missing = await s.call("get_component", { name: "nope" });
    expect(missing.isError).toBe(true);
    expect(missing.content[0].text).toMatch(/Not found in registry/);
    await s.close();
  });

  it("add_components writes into a Next.js project and returns a structured summary", async () => {
    await nextApp();
    const s = startServer(os.tmpdir()); // the server's own folder is not the project: cwd says where
    await s.init();
    const res = await s.call("add_components", { names: ["card"], cwd, install: false });
    expect(res.isError).toBeUndefined();
    const r = res.structuredContent;
    expect(r.ok).toBe(true);
    expect(r.project).toBe(cwd);
    expect(r.files).toEqual(
      expect.arrayContaining([
        { path: "src/components/mpkcn/mpkcn-theme.css", status: "created" },
        { path: "src/components/mpkcn/button.tsx", status: "created" },
        { path: "src/components/mpkcn/card.tsx", status: "created" },
        { path: "src/components/mpkcn/lib/card-utils.ts", status: "created" },
        { path: "src/app/globals.css", status: "updated", note: '+ @import "../components/mpkcn/mpkcn-theme.css";' },
        { path: "src/app/layout.tsx", status: "updated", note: "+ fonts" },
      ]),
    );
    expect(r.dependencies).toMatchObject({ installed: [], command: "npm install clsx framer-motion" });
    expect(r.imports).toEqual(['import { Card } from "@/components/mpkcn/card";']);
    expect(r.warnings).toEqual([]);
    expect(await readFile(path.join(cwd, "src", "components", "mpkcn", "card.tsx"), "utf8")).toContain("Card");
    expect(await readFile(path.join(cwd, "src", "app", "layout.tsx"), "utf8")).toContain("JetBrains_Mono");

    // Again: everything is skipped, nothing is duplicated.
    const again = await s.call("add_components", { names: ["card"], cwd, install: false });
    expect(again.structuredContent.files).toContainEqual({ path: "src/components/mpkcn/card.tsx", status: "skipped" });
    await s.close();
  });

  it("init_project returns the checks", async () => {
    await nextApp();
    const s = startServer(cwd);
    await s.init();
    const res = await s.call("init_project", { install: false });
    expect(res.isError).toBeUndefined();
    expect(res.structuredContent.checks).toContainEqual({ ok: true, message: "react 19.3.0" });
    expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "mpkcn-theme.css"))).toBe(true);
    await s.close();
  });

  it("rejects bad names, traversal, a missing package.json and bad arguments as tool errors", async () => {
    await write("package.json", "{}");
    const s = startServer(cwd);
    await s.init();

    const bad = await s.call("add_components", { names: ["../theme", "ok-name"] });
    expect(bad.isError).toBe(true);
    expect(bad.content[0].text).toMatch(/Invalid component name\(s\): "\.\.\/theme"/);

    const evil = await s.call("add_components", { names: ["evil"], install: false });
    expect(evil.isError).toBe(true);
    expect(evil.content[0].text).toMatch(/outside/);
    expect(existsSync(path.join(cwd, "components", "evil"))).toBe(false);
    expect(existsSync(path.join(cwd, "components", "mpkcn", "ok.tsx"))).toBe(false);

    const evilDep = await s.call("add_components", { names: ["evil-dep"], install: false });
    expect(evilDep.isError).toBe(true);
    expect(evilDep.content[0].text).toMatch(/Invalid item name/);

    const outsideDir = await s.call("add_components", { names: ["plain"], dir: "../elsewhere", install: false });
    expect(outsideDir.isError).toBe(true);
    expect(outsideDir.content[0].text).toMatch(/inside the project/);

    const noPkg = await s.call("add_components", { names: ["plain"], cwd: os.tmpdir() });
    expect(noPkg.isError).toBe(true);
    expect(noPkg.content[0].text).toMatch(/No package.json/);

    const wrongType = await s.call("add_components", { names: "plain" });
    expect(wrongType.isError).toBe(true);
    expect(wrongType.content[0].text).toMatch(/array of strings/);

    const extra = await s.call("list_components", { bogus: 1 });
    expect(extra.isError).toBe(true);

    // The server is still alive after all that.
    expect((await s.request("ping")).result).toEqual({});
    await s.close();
  });

  it("answers protocol errors with JSON-RPC errors and keeps running", async () => {
    const s = startServer(cwd);
    expect((await s.raw("{not json")).error?.code).toBe(-32700);
    expect((await s.raw('{"jsonrpc":"2.0","id":7}')).error?.code).toBe(-32600);
    expect((await s.raw('[{"jsonrpc":"2.0","id":8,"method":"ping"}]')).error?.code).toBe(-32600);
    expect((await s.request("resources/list")).error?.code).toBe(-32601);
    expect((await s.request("tools/call", { name: "rm_rf", arguments: {} })).error).toMatchObject({
      code: -32602,
      message: "Unknown tool: rm_rf",
    });
    expect((await s.request("initialize", {})).error?.code).toBe(-32602);
    expect((await s.request("ping")).result).toEqual({});
    expect(s.lines.every((l) => !l.includes("\n"))).toBe(true);
    await s.close();
  });
});

describe("mcp with the official SDK client", () => {
  it("connects, lists, gets and adds", async () => {
    await nextApp();
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [CLI, "mcp", "--registry", REGISTRY],
      cwd,
      stderr: "pipe",
    });
    const client = new Client({ name: "mpkcn-test", version: "1.0.0" });
    await client.connect(transport);
    try {
      expect(client.getServerVersion()?.name).toBe("mpkcn");
      expect(client.getInstructions()).toContain("list_components");

      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name)).toContain("add_components");

      const list = await client.callTool({ name: "list_components", arguments: { query: "button" } });
      expect((list.structuredContent as { count: number }).count).toBeGreaterThan(0);

      const get = await client.callTool({ name: "get_component", arguments: { name: "button" } });
      expect((get.structuredContent as { import: string }).import).toBe('import { Button } from "@/components/mpkcn/button";');

      const add = await client.callTool({ name: "add_components", arguments: { names: ["button"], cwd, install: false } });
      expect(add.isError).toBeFalsy();
      expect((add.structuredContent as { imports: string[] }).imports).toEqual([
        'import { Button } from "@/components/mpkcn/button";',
      ]);
      expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "button.tsx"))).toBe(true);

      const bad = await client.callTool({ name: "add_components", arguments: { names: ["Bad Name"], cwd } });
      expect(bad.isError).toBe(true);
    } finally {
      await client.close();
    }
  });
});

describe("mcp units", () => {
  it("prints the install snippets for mpkcn mcp --help", async () => {
    const out: string[] = [];
    expect(await run(["mcp", "--help"], { cwd, stdout: (l) => out.push(l), stderr: (l) => out.push(l) })).toBe(0);
    const text = out.join("\n");
    expect(text).toContain("claude mcp add mpkcn -- npx -y mpkcn@latest mcp");
    expect(text).toContain(".cursor/mcp.json");
    expect(text).toContain('"servers"');
    expect(text).toContain("claude_desktop_config.json");
  });

  it("validates tool arguments", () => {
    const schema = {
      type: "object" as const,
      properties: {
        names: { type: "array" as const, description: "", items: { type: "string" as const }, minItems: 1, maxItems: 2 },
        install: { type: "boolean" as const, description: "" },
      },
      required: ["names"],
      additionalProperties: false as const,
    };
    expect(validateArgs(schema, { names: ["a"] })).toBeUndefined();
    expect(validateArgs(schema, {})).toMatch(/Missing required/);
    expect(validateArgs(schema, { names: [] })).toMatch(/at least 1/);
    expect(validateArgs(schema, { names: ["a", "b", "c"] })).toMatch(/at most 2/);
    expect(validateArgs(schema, { names: ["a"], install: "yes" })).toMatch(/true or false/);
    expect(validateArgs(schema, { names: ["a"], other: 1 })).toMatch(/Unknown argument/);
  });
});
