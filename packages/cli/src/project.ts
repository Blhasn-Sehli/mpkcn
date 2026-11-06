import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type PackageJson = {
  packageManager?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** The project's package.json, or undefined when there is none (or it is not valid JSON). */
export function readPackageJson(cwd: string): PackageJson | undefined {
  try {
    const data = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8")) as unknown;
    return typeof data === "object" && data !== null ? (data as PackageJson) : undefined;
  } catch {
    return undefined;
  }
}

/** Every package listed in dependencies, devDependencies or peerDependencies, with its range. */
export function declaredDependencies(pkg: PackageJson | undefined): Map<string, string> {
  const all = new Map<string, string>();
  for (const group of [pkg?.peerDependencies, pkg?.devDependencies, pkg?.dependencies]) {
    if (group && typeof group === "object") {
      for (const [name, range] of Object.entries(group)) all.set(name, String(range));
    }
  }
  return all;
}

/** Major version from a range like "^19.1.0" or "4.x"; undefined for "latest", "workspace:*", etc. */
export function majorOf(range: string): number | undefined {
  const m = /^[\^~>=v\s]*(\d+)(?:[.\s]|$)/.exec(range.trim());
  return m ? Number(m[1]) : undefined;
}

export type Check = { ok: boolean; message: string };

type Requirement = { name: string; major?: number; label: string; why: string; fix: (pm: Fix) => string };
type Fix = { install: (deps: string[]) => string; installDev: (deps: string[]) => string };

const REQUIREMENTS: Requirement[] = [
  {
    name: "react",
    major: 19,
    label: "React 19",
    why: "the components are React 19 client components",
    fix: (f) => f.install(["react@19", "react-dom@19"]),
  },
  {
    name: "tailwindcss",
    major: 4,
    label: "Tailwind CSS 4",
    why: "the theme is written as Tailwind 4 theme variables",
    fix: (f) => `${f.installDev(["tailwindcss@4"])}  (setup: https://tailwindcss.com/docs/installation)`,
  },
  {
    name: "next-themes",
    label: "next-themes",
    why: "it switches the dark and light themes",
    fix: (f) => f.install(["next-themes"]),
  },
];

/** Checks React 19, Tailwind 4 and next-themes in package.json. Packages in `skip` are not checked. */
export function checkPrerequisites(
  cwd: string,
  fix: Fix,
  skip: ReadonlySet<string> = new Set(),
): Check[] {
  const pkg = readPackageJson(cwd);
  if (!pkg) {
    return [{ ok: false, message: "No package.json found here. Run mpkcn from your project root." }];
  }
  const declared = declaredDependencies(pkg);
  const checks: Check[] = [];
  for (const req of REQUIREMENTS) {
    if (skip.has(req.name)) continue;
    const range = declared.get(req.name);
    if (range === undefined) {
      checks.push({ ok: false, message: `${req.label} is missing (${req.why}). Fix: ${req.fix(fix)}` });
      continue;
    }
    const major = majorOf(range);
    if (req.major !== undefined && major !== undefined && major < req.major) {
      checks.push({ ok: false, message: `${req.name} ${range} is too old, mpkcn needs ${req.label}. Fix: ${req.fix(fix)}` });
      continue;
    }
    checks.push({ ok: true, message: `${req.name} ${range}` });
  }
  return checks;
}

/** Removes comments and trailing commas so tsconfig.json can go through JSON.parse. */
export function stripJsonc(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
    } else {
      out += c;
      i++;
    }
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/** Folder that the `@/*` alias of tsconfig.json (or jsconfig.json) points to, if any. */
export function aliasRoot(cwd: string): string | undefined {
  for (const file of ["tsconfig.json", "jsconfig.json"]) {
    const full = path.join(cwd, file);
    if (!existsSync(full)) continue;
    try {
      const config = JSON.parse(stripJsonc(readFileSync(full, "utf8"))) as {
        compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
      };
      const target = config.compilerOptions?.paths?.["@/*"]?.[0];
      if (typeof target !== "string" || !target.endsWith("*")) return undefined;
      return path.resolve(cwd, config.compilerOptions?.baseUrl ?? ".", target.slice(0, -1));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * The specifier to import a file from: "@/components/mpkcn/boot-screen" when the
 * `@/*` alias covers it, otherwise the path from the project root.
 */
export function importSpecifier(cwd: string, file: string): { specifier: string; alias: boolean } {
  const noExt = file.replace(/\.(tsx|ts|jsx|js)$/, "");
  const root = aliasRoot(cwd);
  if (root) {
    const rel = path.relative(root, noExt);
    if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
      return { specifier: `@/${rel.split(path.sep).join("/")}`, alias: true };
    }
  }
  return { specifier: `./${path.relative(cwd, noExt).split(path.sep).join("/")}`, alias: false };
}

/** First exported component name in a source file, e.g. "BootScreen". */
export function exportedName(source: string, fallback: string): string {
  const m = /export\s+(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/.exec(source);
  if (m) return m[1];
  return fallback.replace(/(^|-)([a-z0-9])/g, (_, __, ch: string) => ch.toUpperCase());
}
