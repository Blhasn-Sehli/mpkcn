import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCli } from "../src/args.js";
import { run, type Context } from "../src/cli.js";
import { CliError } from "../src/errors.js";
import { addThemeImport, findGlobalCss, relativeImport } from "../src/css.js";
import {
  assertValidSpec,
  detectPackageManager,
  installArgs,
  installCommand,
  installDevCommand,
  packageName,
} from "../src/pm.js";
import { addFonts, addProvider, GOOGLE_FONTS_IMPORT } from "../src/layout.js";
import { aliasRoot, exportedName, majorOf } from "../src/project.js";
import { fetchItem, isValidName } from "../src/registry.js";
import { collectDependencies, resolveItems } from "../src/resolve.js";
import { safeTargetPath } from "../src/write.js";

const REGISTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "r");

let cwd: string;
let out: string[];
let err: string[];
let ctx: Context;
let calls: { cmd: string; args: string[]; cwd: string }[];
let exitCode: number;

beforeEach(async () => {
  cwd = await mkdtemp(path.join(os.tmpdir(), "mpkcn-test-"));
  out = [];
  err = [];
  calls = [];
  exitCode = 0;
  ctx = {
    cwd,
    stdout: (l) => out.push(l),
    stderr: (l) => err.push(l),
    // Never spawn a real package manager in tests.
    exec: async (cmd, args, opts) => {
      calls.push({ cmd, args, cwd: opts.cwd });
      return exitCode;
    },
  };
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

const write = async (rel: string, content: string) => {
  const full = path.join(cwd, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
};
const read = (rel: string) => readFile(path.join(cwd, rel), "utf8");
const pkg = (deps: Record<string, string>, extra: Record<string, unknown> = {}) =>
  write("package.json", JSON.stringify({ name: "app", dependencies: deps, ...extra }));
const NEXT_DEPS = { react: "^19.3.0", "react-dom": "^19.3.0", next: "16.4.5", tailwindcss: "^4.1.0", "next-themes": "^0.4.6" };
const count = (text: string, needle: string) => text.split(needle).length - 1;

describe("global CSS", () => {
  it("finds src/app/globals.css and inserts the import right after tailwindcss", async () => {
    await write("src/app/globals.css", '@import "tailwindcss";\n\nbody { margin: 0; }\n');
    expect(await add("plain")).toBe(0);
    expect(await read("src/app/globals.css")).toBe(
      '@import "tailwindcss";\n@import "../components/mpkcn/mpkcn-theme.css";\n\nbody { margin: 0; }\n',
    );
    expect(out.join("\n")).toContain('updated     src/app/globals.css  (+ @import "../components/mpkcn/mpkcn-theme.css";)');
  });

  it("is idempotent: a second add never duplicates the import", async () => {
    await write("app/globals.css", '@import "tailwindcss";\n');
    expect(await add("plain")).toBe(0);
    expect(await add("button")).toBe(0);
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    const css = await read("app/globals.css");
    expect(count(css, "mpkcn-theme.css")).toBe(1);
    expect(css).toBe('@import "tailwindcss";\n@import "../components/mpkcn/mpkcn-theme.css";\n');
    expect(out.join("\n")).toContain("app/globals.css already imports the theme");
  });

  it("falls back to any CSS file that imports tailwindcss, keeping CRLF", async () => {
    await write("src/ui/theme/main.css", '@charset "utf-8";\r\n@import \'tailwindcss\' source("../");\r\n.a{}\r\n');
    expect(findGlobalCss(cwd)).toBe(path.join(cwd, "src", "ui", "theme", "main.css"));
    expect(await add("plain")).toBe(0);
    expect(await read("src/ui/theme/main.css")).toBe(
      '@charset "utf-8";\r\n@import \'tailwindcss\' source("../");\r\n@import "../../components/mpkcn/mpkcn-theme.css";\r\n.a{}\r\n',
    );
  });

  it("ignores node_modules and prefers known paths that import tailwind", async () => {
    await write("node_modules/x/style.css", '@import "tailwindcss";');
    expect(findGlobalCss(cwd)).toBeUndefined();
    await write("src/index.css", "body{}\n");
    expect(findGlobalCss(cwd)).toBe(path.join(cwd, "src", "index.css"));
    await write("src/app/globals.css", '@import "tailwindcss";\n');
    expect(findGlobalCss(cwd)).toBe(path.join(cwd, "src", "app", "globals.css"));
  });

  it("adds the import at the top when there is no tailwind import, and builds relative paths", async () => {
    await write("a.css", ".x{}\n");
    const theme = path.join(cwd, "components", "mpkcn", "mpkcn-theme.css");
    expect(addThemeImport(path.join(cwd, "a.css"), theme).status).toBe("added");
    expect(await read("a.css")).toBe('@import "./components/mpkcn/mpkcn-theme.css";\n.x{}\n');
    expect(addThemeImport(path.join(cwd, "a.css"), theme).status).toBe("present");
    expect(relativeImport(path.join(cwd, "src", "app", "globals.css"), path.join(cwd, "src", "components", "t.css"))).toBe(
      "../components/t.css",
    );
  });

  it("--css picks the file, even when another one is detected", async () => {
    await write("src/app/globals.css", '@import "tailwindcss";\n');
    await write("styles/site.css", '@import "tailwindcss";\n');
    expect(await add("plain", "--css", "styles/site.css")).toBe(0);
    expect(await read("styles/site.css")).toContain('@import "../src/components/mpkcn/mpkcn-theme.css";');
    expect(await read("src/app/globals.css")).not.toContain("mpkcn-theme");
  });

  it("--css with a missing file fails before writing anything", async () => {
    expect(await add("plain", "--css", "nope.css")).toBe(1);
    expect(err.join("\n")).toContain("CSS file not found: nope.css");
    expect(existsSync(path.join(cwd, "components"))).toBe(false);
  });

  it("prints the exact line when no CSS file is found", async () => {
    expect(await add("plain")).toBe(0);
    expect(out).toContain('  @import "components/mpkcn/mpkcn-theme.css";');
    expect(out.join("\n")).toContain("npx mpkcn init --css <path>");
  });
});

describe("install", () => {
  it("runs the detected package manager with the missing deps", async () => {
    await pkg({}, { packageManager: "pnpm@10.28.0" });
    expect(await add("card")).toBe(0);
    expect(calls).toEqual([{ cmd: "pnpm", args: ["add", "clsx", "framer-motion"], cwd }]);
    expect(out).toContain("  pnpm add clsx framer-motion");
  });

  it("skips packages already in package.json", async () => {
    await pkg({ clsx: "^2.1.0" });
    expect(await add("card")).toBe(0);
    expect(calls).toEqual([{ cmd: "npm", args: ["install", "framer-motion"], cwd }]);
    expect(out.join("\n")).toContain("Already in package.json: clsx");
  });

  it("does not run anything when every dep is installed", async () => {
    await pkg({}, { devDependencies: { clsx: "2", "framer-motion": "13" } });
    expect(await add("card")).toBe(0);
    expect(calls).toEqual([]);
  });

  it("--no-install only prints the command", async () => {
    await write("yarn.lock", "");
    expect(await add("card", "--no-install")).toBe(0);
    expect(calls).toEqual([]);
    expect(out).toContain("Install the npm dependencies:");
    expect(out).toContain("  yarn add clsx framer-motion");
  });

  it("exits 1 and prints the command when the install fails", async () => {
    exitCode = 1;
    expect(await add("button")).toBe(1);
    expect(existsSync(path.join(cwd, "components", "mpkcn", "button.tsx"))).toBe(true);
    expect(err.join("\n")).toContain("the install failed (exit code 1)");
    expect(err).toContain("  npm install clsx");
  });

  it("builds the install command for each package manager", () => {
    expect(installArgs("npm", ["a", "b"])).toEqual({ cmd: "npm", args: ["install", "a", "b"] });
    expect(installArgs("pnpm", ["a"])).toEqual({ cmd: "pnpm", args: ["add", "a"] });
    expect(installArgs("yarn", ["a"])).toEqual({ cmd: "yarn", args: ["add", "a"] });
    expect(installArgs("bun", ["a"])).toEqual({ cmd: "bun", args: ["add", "a"] });
    expect(installCommand("yarn", ["@scope/a@1", "b"])).toBe("yarn add @scope/a@1 b");
    expect(installDevCommand("npm", ["t"])).toBe("npm install -D t");
    expect(installDevCommand("pnpm", ["t"])).toBe("pnpm add -D t");
    expect(installDevCommand("bun", ["t"])).toBe("bun add --dev t");
  });

  it("only accepts plain npm package specs", () => {
    for (const ok of ["clsx", "framer-motion@13", "@radix-ui/react-slot", "@a/b@^1.2.0"]) {
      expect(() => assertValidSpec(ok), ok).not.toThrow();
    }
    for (const bad of ["a b", "a;rm -rf /", "a&&b", "$(x)", "a@>1 <2", "A|B"]) {
      expect(() => assertValidSpec(bad), bad).toThrow(CliError);
    }
    expect(packageName("@a/b@1")).toBe("@a/b");
    expect(packageName("framer-motion@13")).toBe("framer-motion");
  });
});

describe("init", () => {
  it("writes the theme, adds the import and passes the checks", async () => {
    await pkg(NEXT_DEPS);
    await write("src/app/globals.css", '@import "tailwindcss";\n');
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "mpkcn-theme.css"))).toBe(true);
    expect(await read("src/app/globals.css")).toContain('@import "../components/mpkcn/mpkcn-theme.css";');
    const text = out.join("\n");
    expect(text).not.toContain("warn");
    expect(text).toContain("ok    react ^19.3.0");
    expect(text).toContain("Ready. Add a component: npx mpkcn add boot-screen");
    expect(calls).toEqual([]);
  });

  it("warns about missing or old prerequisites and says how to fix them", async () => {
    await pkg({ react: "^18.3.1" }, { packageManager: "pnpm@10" });
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    const text = out.join("\n");
    expect(text).toContain("warn  react ^18.3.1 is too old, mpkcn needs React 19. Fix: pnpm add react@19 react-dom@19");
    expect(text).toContain("warn  Tailwind CSS 4 is missing");
    expect(text).toContain("pnpm add -D tailwindcss@4");
    expect(text).toContain("warn  next-themes is missing (it switches the dark and light themes). Fix: pnpm add next-themes");
    expect(text).toContain("Fix the warnings above");
  });

  it("warns when there is no package.json", async () => {
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(out.join("\n")).toContain("warn  No package.json found here");
  });

  it("add runs the init checks on the first run only, quietly", async () => {
    await pkg({ react: "^19.3.0", tailwindcss: "^4.0.0" });
    expect(await add("plain")).toBe(0);
    expect(out).toContain("Heads up");
    expect(out.filter((l) => l.includes("warn"))).toHaveLength(1);
    expect(out.join("\n")).toContain("next-themes is missing");
    expect(out.join("\n")).not.toContain("ok    react");

    out.length = 0;
    expect(await add("button")).toBe(0);
    expect(out).not.toContain("Heads up");
    expect(out[0]).toBe("Adding button");
    expect(out.join("\n")).not.toContain("mpkcn-theme.css");

    out.length = 0;
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(out).toContain("  ok          components/mpkcn/mpkcn-theme.css already there");
  });

  it("rejects names after init", async () => {
    expect(await run(["init", "card"], ctx)).toBe(1);
    expect(err.join("\n")).toContain('"init" takes no names');
  });
});

describe("next step", () => {
  it("prints an @/ import when tsconfig has the alias", async () => {
    await mkdir(path.join(cwd, "src"));
    await write(
      "tsconfig.json",
      '{\n  // Next.js\n  "compilerOptions": {\n    "paths": { "@/*": ["./src/*"], },\n  },\n}\n',
    );
    expect(aliasRoot(cwd)).toBe(path.join(cwd, "src"));
    expect(await add("card")).toBe(0);
    expect(out.at(-2)).toBe("Done. Use it:");
    expect(out.at(-1)).toBe('  import { Card } from "@/components/mpkcn/card";');
  });

  it("prints a root-relative hint without the alias", async () => {
    expect(await add("card", "button")).toBe(0);
    expect(out).toContain("Done. Use them:");
    expect(out.join("\n")).toContain(
      'import { Button } from "./components/mpkcn/button";  // path from the project root: make it relative to your file',
    );
  });

  it("reads names and versions", () => {
    expect(exportedName("export type X = 1;\nexport function BootScreen() {}", "boot-screen")).toBe("BootScreen");
    expect(exportedName("const a = 1;", "theme-toggle")).toBe("ThemeToggle");
    expect(majorOf("^19.3.0")).toBe(19);
    expect(majorOf("4.x")).toBe(4);
    expect(majorOf(">=18")).toBe(18);
    expect(majorOf("latest")).toBeUndefined();
    expect(majorOf("workspace:*")).toBeUndefined();
  });
});

// The root layout of `create-next-app@16.4.5 --ts --tailwind --app --src-dir`, byte for byte.
const LAYOUT_16 = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
`;

const LAYOUT_16_WIRED = `import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { MpkcnThemeProvider } from "@/components/mpkcn/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={\`\${geistSans.variable} \${geistMono.variable} \${spaceGrotesk.variable} \${jetbrainsMono.variable} h-full antialiased\`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <MpkcnThemeProvider>{children}</MpkcnThemeProvider>
      </body>
    </html>
  );
}
`;

// The earlier create-next-app template (Next.js 15 and early 16): fonts on <body>, Readonly props.
const LAYOUT_15 = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`\${geistSans.variable} \${geistMono.variable} antialiased\`}
      >
        {children}
      </body>
    </html>
  );
}
`;

const NEXT_APP = { react: "19.3.0", "react-dom": "19.3.0", next: "16.4.5", tailwindcss: "^4" };

/** A fresh create-next-app project: package.json, tsconfig, globals.css and the layout. */
async function nextApp(opts: { layout?: string } = {}) {
  await pkg(NEXT_APP);
  await write("tsconfig.json", '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }');
  await write("src/app/globals.css", '@import "tailwindcss";\n');
  await write("src/app/layout.tsx", opts.layout ?? LAYOUT_16);
  return "src/app/layout.tsx";
}

describe("root layout", () => {
  it("wires the provider and the fonts into the create-next-app layout (src/)", async () => {
    const layout = await nextApp();
    expect(await add("toggle")).toBe(0);
    expect(await read(layout)).toBe(LAYOUT_16_WIRED);
    expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "theme-provider.tsx"))).toBe(true);
    expect(out).toContain("Adding toggle (+ theme, theme-provider)");
    expect(out).toContain("  updated     src/app/layout.tsx  (+ fonts, theme provider)");
    expect(calls).toEqual([{ cmd: "npm", args: ["install", "next-themes"], cwd }]);
    expect(out.at(-1)).toBe('  import { Toggle } from "@/components/mpkcn/toggle";');
    expect(out.join("\n")).not.toContain("left as is");
  });

  it("wires the older template without src/, with a relative import when there is no alias", async () => {
    await pkg(NEXT_APP);
    await write("app/globals.css", '@import "tailwindcss";\n');
    await write("app/layout.tsx", LAYOUT_15);
    expect(await add("toggle")).toBe(0);
    const text = await read("app/layout.tsx");
    expect(text).toContain(
      'import { Geist, Geist_Mono, JetBrains_Mono, Space_Grotesk } from "next/font/google";\n' +
        'import { MpkcnThemeProvider } from "../components/mpkcn/theme-provider";\nimport "./globals.css";',
    );
    expect(text).toContain(
      '    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>\n' +
        "      <body\n        className={`${geistSans.variable} ${geistMono.variable} antialiased`}\n      >\n" +
        "        <MpkcnThemeProvider>{children}</MpkcnThemeProvider>\n      </body>",
    );
    expect(count(text, "const jetbrainsMono")).toBe(1);
    expect(out).toContain("  updated     app/layout.tsx  (+ fonts, theme provider)");
  });

  it("is idempotent: add, add again and init leave one provider and one set of fonts", async () => {
    const layout = await nextApp();
    expect(await add("toggle")).toBe(0);
    out.length = 0;
    expect(await add("toggle")).toBe(0);
    expect(await add("button")).toBe(0);
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(await read(layout)).toBe(LAYOUT_16_WIRED);
    expect(out.join("\n")).not.toContain("updated     src/app/layout.tsx");
    expect(out.join("\n")).not.toContain("theme-provider.tsx  (exists");
  });

  it("leaves an already wired layout alone", async () => {
    const layout = await nextApp({ layout: LAYOUT_16_WIRED });
    expect(await add("toggle")).toBe(0);
    expect(await read(layout)).toBe(LAYOUT_16_WIRED);
    expect(out.join("\n")).not.toContain("layout.tsx");
  });

  it("does not touch a layout that has its own next-themes provider", async () => {
    const own = LAYOUT_16.replace(
      'import "./globals.css";',
      'import { ThemeProvider } from "next-themes";\nimport "./globals.css";',
    ).replace("{children}</body>", '<ThemeProvider attribute="class">{children}</ThemeProvider></body>');
    const layout = await nextApp({ layout: own });
    expect(await add("toggle", "--no-fonts")).toBe(0);
    expect(await read(layout)).toBe(own);
    expect(out).toContain("  ok          src/app/layout.tsx already has a ThemeProvider");
  });

  it("falls back to printing the lines for an unusual layout, without changing it", async () => {
    const odd = `import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", "antialiased")}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
`;
    const layout = await nextApp({ layout: odd });
    expect(await add("toggle")).toBe(0);
    expect(await read(layout)).toBe(odd);
    const text = out.join("\n");
    expect(text).toContain(
      "src/app/layout.tsx has an unusual shape, so it was left as is. Add the theme provider to it:",
    );
    expect(out).toContain('  import { MpkcnThemeProvider } from "@/components/mpkcn/theme-provider";');
    expect(out).toContain("  <body><MpkcnThemeProvider>{children}</MpkcnThemeProvider></body>");
    expect(text).toContain("src/app/layout.tsx was left as is. Load the fonts in your root layout:");
    expect(out).toContain('  import { JetBrains_Mono, Space_Grotesk } from "next/font/google";');
    expect(out).toContain("  <html className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>");
    expect(text).not.toContain("updated     src/app/layout.tsx");
  });

  it("prints the lines when there is no root layout", async () => {
    await pkg(NEXT_APP);
    expect(await add("toggle")).toBe(0);
    expect(out.join("\n")).toContain("No root layout found. Add the theme provider to it:");
    expect(out).toContain('  import { MpkcnThemeProvider } from "../components/mpkcn/theme-provider";');
  });

  it("--no-layout never edits the layout", async () => {
    const layout = await nextApp();
    expect(await add("toggle", "--no-layout")).toBe(0);
    expect(await read(layout)).toBe(LAYOUT_16);
    const text = out.join("\n");
    expect(text).not.toContain("theme provider to it");
    expect(text).toContain("Load the fonts in your root layout:");
    expect(existsSync(path.join(cwd, "src", "components", "mpkcn", "theme-provider.tsx"))).toBe(true);
  });

  it("--no-fonts wires only the provider", async () => {
    const layout = await nextApp();
    expect(await add("toggle", "--no-fonts")).toBe(0);
    const text = await read(layout);
    expect(text).toContain("<MpkcnThemeProvider>{children}</MpkcnThemeProvider>");
    expect(text).not.toContain("JetBrains_Mono");
    expect(out).toContain("  updated     src/app/layout.tsx  (+ theme provider)");
    expect(out.join("\n")).not.toContain("Load the fonts");
  });

  it("loads the fonts for any component, without the provider", async () => {
    const layout = await nextApp();
    expect(await add("plain")).toBe(0);
    const text = await read(layout);
    expect(text).toContain('variable: "--font-space-grotesk"');
    expect(text).not.toContain("MpkcnThemeProvider");
    expect(text).not.toContain("suppressHydrationWarning");
    expect(out).toContain("  updated     src/app/layout.tsx  (+ fonts)");
  });

  it("upgrades the 0.2 theme font lines so they read the next/font variables", async () => {
    await nextApp();
    const theme = "src/components/mpkcn/mpkcn-theme.css";
    await write(
      theme,
      '@theme inline {\n  --font-mpk-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;\n' +
        '  --font-mpk-sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;\n}\n',
    );
    expect(await add("plain")).toBe(0);
    expect(await read(theme)).toBe(
      '@theme inline {\n  --font-mpk-mono: var(--font-jetbrains-mono, "JetBrains Mono"), ui-monospace, Consolas, monospace;\n' +
        '  --font-mpk-sans: var(--font-space-grotesk, "Space Grotesk"), ui-sans-serif, system-ui, sans-serif;\n}\n',
    );
    expect(out).toContain("  updated     src/components/mpkcn/mpkcn-theme.css  (fonts read the next/font variables)");
  });

  it("init writes the provider, wires the layout and reports both as ok", async () => {
    const layout = await nextApp();
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(await read(layout)).toBe(LAYOUT_16_WIRED);
    expect(calls).toEqual([{ cmd: "npm", args: ["install", "next-themes"], cwd }]);
    const text = out.join("\n");
    expect(text).toContain("created     src/components/mpkcn/theme-provider.tsx");
    expect(text).toContain("ok    theme provider in src/app/layout.tsx");
    expect(text).toContain("ok    fonts loaded with next/font in src/app/layout.tsx");
    expect(text).not.toContain("warn");
    expect(text).toContain("Ready.");
  });

  it("init warns about the provider and fonts it could not add", async () => {
    await nextApp({ layout: "export default function L({ children }) { return children; }\n" });
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    const text = out.join("\n");
    expect(text).toContain("warn  the theme provider is not in src/app/layout.tsx. Fix: add the lines above");
    expect(text).toContain("warn  the fonts are not loaded in src/app/layout.tsx. Fix: add the lines above");
    expect(text).toContain("Fix the warnings above");
  });
});

describe("projects without Next.js", () => {
  const vite = async () => {
    await pkg({ react: "^19.3.0", "react-dom": "^19.3.0", tailwindcss: "^4.1.0", vite: "^7.0.0" });
    await write("src/index.css", '@import "tailwindcss";\n');
  };

  it("prints the provider usage and the Google Fonts @import, and edits nothing else", async () => {
    await vite();
    expect(await add("toggle")).toBe(0);
    expect(out).toContain("Wrap your app in the theme provider (in your root component):");
    expect(out).toContain("  <MpkcnThemeProvider><App /></MpkcnThemeProvider>");
    expect(out).toContain("Load the fonts: add this line at the very top of src/index.css:");
    expect(out).toContain(`  ${GOOGLE_FONTS_IMPORT}`);
    expect(await read("src/index.css")).toBe('@import "tailwindcss";\n@import "./components/mpkcn/mpkcn-theme.css";\n');
    expect(existsSync(path.join(cwd, "src", "app"))).toBe(false);
  });

  it("prints the font line only on the first run, and not with --no-fonts", async () => {
    await vite();
    expect(await add("plain", "--no-fonts")).toBe(0);
    expect(out.join("\n")).not.toContain("fonts.googleapis.com");
    out.length = 0;
    expect(await add("button")).toBe(0);
    expect(out.join("\n")).not.toContain("fonts.googleapis.com");
  });

  it("init reports the fonts as ok once the @import is there", async () => {
    await vite();
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(out.join("\n")).toContain("warn  the fonts are not loaded. Fix: add the @import line above");
    await write("src/index.css", `${GOOGLE_FONTS_IMPORT}\n@import "tailwindcss";\n`);
    out.length = 0;
    expect(await run(["init", "--registry", REGISTRY], ctx)).toBe(0);
    expect(out.join("\n")).toContain("ok    fonts loaded from Google Fonts in src/index.css");
    expect(out.join("\n")).not.toContain("theme-provider.tsx");
  });
});

describe("layout edits (units)", () => {
  it("keeps CRLF, single quotes and no semicolons", () => {
    const src = [
      "import { Inter } from 'next/font/google'",
      "import './globals.css'",
      "",
      "export default function RootLayout({ children }) {",
      "  return (",
      "    <html lang='en' className='scroll-smooth'>",
      "      <body>{children}</body>",
      "    </html>",
      "  )",
      "}",
      "",
    ].join("\r\n");
    const fonts = addFonts(src);
    expect(fonts.status).toBe("added");
    const both = addProvider(fonts.text, "@/components/mpkcn/theme-provider");
    expect(both.status).toBe("added");
    expect(both.text).not.toMatch(/[^\r]\n/);
    expect(both.text).toContain("import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'\r\n");
    expect(both.text).toContain("import { MpkcnThemeProvider } from '@/components/mpkcn/theme-provider'\r\n");
    expect(both.text).toContain(
      "const spaceGrotesk = Space_Grotesk({\r\n  variable: '--font-space-grotesk',\r\n  subsets: ['latin'],\r\n})\r\n",
    );
    expect(both.text).toContain(
      "<html lang='en' className={`scroll-smooth ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>",
    );
    expect(both.text).toContain("      <body>\r\n        <MpkcnThemeProvider>{children}</MpkcnThemeProvider>\r\n      </body>");
    expect(addFonts(both.text).status).toBe("present");
    expect(addProvider(both.text, "x").status).toBe("present");
  });

  it("refuses shapes it cannot edit safely", () => {
    const base = (html: string, body = "<body>{children}</body>") =>
      `import "./globals.css";\nexport default function L({ children }) {\n  return (\n    ${html}\n      ${body}\n    </html>\n  );\n}\n`;
    expect(addFonts(base('<html className={cn("a")}>')).status).toBe("unsupported");
    expect(addFonts(base("<html {...props}>")).status).toBe("unsupported");
    expect(addProvider(base("<html>", "<body><Nav />{children}</body>"), "x").status).toBe("unsupported");
    expect(addProvider(base("<html>", "<body>{props.children}</body>"), "x").status).toBe("unsupported");
    expect(addProvider("export default function L({ children }) { return children; }\n", "x").status).toBe("unsupported");
    // Two <html> tags (e.g. a conditional) is not the simple shape.
    const two = base("<html>").replace("    </html>", "    </html>\n    <html></html>");
    expect(addProvider(two, "x").status).toBe("unsupported");
    // A name the font edit would add is already taken.
    const taken = base('<html lang="en">').replace("export default", "const spaceGrotesk = 1;\nexport default");
    expect(addFonts(taken).status).toBe("unsupported");
    // Unchanged text on every refusal.
    expect(addFonts(taken).text).toBe(taken);
  });

  it("parses the new flags", () => {
    expect(parseCli(["add", "a"])).toMatchObject({ layout: true, fonts: true });
    expect(parseCli(["add", "a", "--no-layout", "--no-fonts"])).toMatchObject({ layout: false, fonts: false });
  });
});
