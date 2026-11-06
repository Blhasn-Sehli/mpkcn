import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCli } from "../src/args.js";
import { run, type Context } from "../src/cli.js";
import { CliError } from "../src/errors.js";
import { detectPackageManager, installCommand } from "../src/pm.js";
import { fetchItem, isValidName } from "../src/registry.js";
import { collectDependencies, resolveItems } from "../src/resolve.js";
import { safeTargetPath } from "../src/write.js";

const REGISTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "r");

let cwd: string;
let out: string[];
let err: string[];
let ctx: Context;

beforeEach(async () => {
  cwd = await mkdtemp(path.join(os.tmpdir(), "mpkcn-test-"));
  out = [];
  err = [];
  ctx = { cwd, stdout: (l) => out.push(l), stderr: (l) => err.push(l) };
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

const add = (...args: string[]) => run(["add", ...args, "--registry", REGISTRY], ctx);

describe("add", () => {
  it("writes the item and its registry dependencies into components/mpkcn", async () => {
    expect(await add("card")).toBe(0);
    const dir = path.join(cwd, "components", "mpkcn");
    expect(await readFile(path.join(dir, "card.tsx"), "utf8")).toContain("Card");
    expect(existsSync(path.join(dir, "lib", "card-utils.ts"))).toBe(true);
    expect(existsSync(path.join(dir, "button.tsx"))).toBe(true);
    expect(existsSync(path.join(dir, "mpkcn-theme.css"))).toBe(true);
    expect(out.join("\n")).toContain("npm install clsx framer-motion");
    expect(out.join("\n")).toContain('@import "components/mpkcn/mpkcn-theme.css"');
    expect(err).toEqual([]);
  });

  it("uses src/components/mpkcn when the project has a src folder", async () => {
    await mkdir(path.join(cwd, "src"));
    expect(await add("plain")).toBe(0);
    expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "plain.tsx"))).toBe(true);
  });

  it("honours --dir", async () => {
    expect(await add("plain", "--dir", "app/ui")).toBe(0);
    expect(existsSync(path.join(cwd, "app", "ui", "plain.tsx"))).toBe(true);
  });

  it("includes the theme once and dedupes npm deps", async () => {
    expect(await add("card", "button")).toBe(0);
    const created = out.filter((l) => l.includes("mpkcn-theme.css") && l.includes("created"));
    expect(created).toHaveLength(1);
    const install = out.find((l) => l.includes("npm install"));
    expect(install?.trim()).toBe("npm install clsx framer-motion");
  });

  it("skips existing files unless --overwrite", async () => {
    const dir = path.join(cwd, "components", "mpkcn");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "plain.tsx"), "mine\n");

    expect(await add("plain")).toBe(0);
    expect(out.some((l) => l.includes("skipped"))).toBe(true);
    expect(await readFile(path.join(dir, "plain.tsx"), "utf8")).toBe("mine\n");

    out.length = 0;
    expect(await add("plain", "--overwrite")).toBe(0);
    expect(out.some((l) => l.includes("overwritten"))).toBe(true);
    expect(await readFile(path.join(dir, "plain.tsx"), "utf8")).toBe("export const Plain = 1;\n");
  });

  it("rejects path traversal and writes nothing", async () => {
    expect(await add("evil")).toBe(1);
    expect(err.join("\n")).toMatch(/outside/);
    expect(existsSync(path.join(cwd, "components", "evil"))).toBe(false);
    expect(existsSync(path.join(cwd, "components", "mpkcn", "ok.tsx"))).toBe(false);
  });

  it("rejects absolute targets", async () => {
    expect(await add("evil-abs")).toBe(1);
    expect(err.join("\n")).toMatch(/unsafe file target/);
  });

  it("rejects bad item names, including in registryDependencies", async () => {
    expect(await add("../theme")).toBe(1);
    expect(err.join("\n")).toMatch(/Invalid item name/);
    err.length = 0;
    expect(await add("evil-dep")).toBe(1);
    expect(err.join("\n")).toMatch(/Invalid item name "\.\.\/theme"/);
  });

  it("fails clearly on a missing item", async () => {
    expect(await add("nope")).toBe(1);
    expect(err.join("\n")).toMatch(/Not found in registry/);
  });

  it("uses the detected package manager", async () => {
    await writeFile(path.join(cwd, "pnpm-lock.yaml"), "");
    expect(await add("button")).toBe(0);
    expect(out.join("\n")).toContain("pnpm add clsx");
  });
});

describe("list, help, version", () => {
  it("prints an aligned table from index.json", async () => {
    expect(await run(["list", "--registry", REGISTRY], ctx)).toBe(0);
    expect(out).toEqual([
      "theme   mpkcn color tokens and fonts.",
      "button  A square terminal button.",
      "card    A hairline card that uses the button.",
      "plain",
    ]);
  });

  it("prints help and version", async () => {
    expect(await run(["--help"], ctx)).toBe(0);
    expect(out.join("\n")).toContain("mpkcn add <name...>");
    out.length = 0;
    expect(await run(["--version"], ctx)).toBe(0);
    expect(out[0]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exits 1 with help on an unknown command", async () => {
    expect(await run(["frobnicate"], ctx)).toBe(1);
    expect(err.join("\n")).toContain('Unknown command "frobnicate"');
    expect(err.join("\n")).toContain("Usage");
  });
});

describe("units", () => {
  it("validates names", () => {
    expect(isValidName("boot-screen")).toBe(true);
    for (const bad of ["", "Boot", "a/b", "../x", "a.b", "a b"]) expect(isValidName(bad)).toBe(false);
  });

  it("parses args", () => {
    expect(parseCli(["add", "a", "b", "--overwrite", "--dir", "x"])).toMatchObject({
      command: "add",
      names: ["a", "b"],
      overwrite: true,
      dir: "x",
    });
    expect(() => parseCli(["add"])).toThrow(CliError);
    expect(() => parseCli(["list", "--bogus"])).toThrow(CliError);
  });

  it("safeTargetPath allows nested targets and blocks escapes", () => {
    const root = path.resolve(cwd, "c");
    expect(safeTargetPath(root, "lib/x.ts")).toBe(path.join(root, "lib", "x.ts"));
    for (const bad of ["../x", "lib/../../x", "..", ".", "", "/etc/passwd", "C:\\x", "\\\\server\\share\\x"]) {
      expect(() => safeTargetPath(root, bad), bad).toThrow(CliError);
    }
  });

  it("resolves dependencies first, each once, and survives cycles", async () => {
    const items = await resolveItems(["card", "button"], (n) => fetchItem(REGISTRY, n, cwd));
    expect(items.map((i) => i.name)).toEqual(["theme", "button", "card"]);
    expect(collectDependencies(items)).toEqual(["clsx", "framer-motion"]);

    const fake = (name: string, deps: string[]) => ({
      name, title: name, description: "", dependencies: [], registryDependencies: deps, files: [],
    });
    const cyclic = await resolveItems(["a"], async (n) => (n === "a" ? fake("a", ["b"]) : fake("b", ["a"])));
    expect(cyclic.map((i) => i.name)).toEqual(["b", "a"]);
  });

  it("detects the package manager from lockfiles", async () => {
    expect(detectPackageManager(cwd)).toBe("npm");
    for (const [file, pm] of [
      ["package-lock.json", "npm"],
      ["bun.lockb", "bun"],
      ["yarn.lock", "yarn"],
      ["pnpm-lock.yaml", "pnpm"],
    ] as const) {
      await writeFile(path.join(cwd, file), "");
      expect(detectPackageManager(cwd)).toBe(pm);
    }
    expect(installCommand("npm", ["a", "b"])).toBe("npm install a b");
    expect(installCommand("bun", ["a"])).toBe("bun add a");
  });
});
