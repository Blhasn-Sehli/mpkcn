import { existsSync } from "node:fs";
import path from "node:path";
import { CliError } from "./errors.js";
import { readPackageJson } from "./project.js";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

const MANAGERS: PackageManager[] = ["pnpm", "yarn", "bun", "npm"];

const LOCKFILES: [string, PackageManager][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
];

/**
 * Picks the package manager: the `packageManager` field of package.json first,
 * then the lockfile in `cwd`; npm when neither says anything.
 */
export function detectPackageManager(cwd: string): PackageManager {
  const field = readPackageJson(cwd)?.packageManager;
  if (typeof field === "string") {
    const name = field.split("@")[0] as PackageManager;
    if (MANAGERS.includes(name)) return name;
  }
  for (const [file, pm] of LOCKFILES) {
    if (existsSync(path.join(cwd, file))) return pm;
  }
  return "npm";
}

/** Program and arguments that install `deps` (as runtime dependencies) with `pm`. */
export function installArgs(pm: PackageManager, deps: string[]): { cmd: string; args: string[] } {
  return { cmd: pm, args: [pm === "npm" ? "install" : "add", ...deps] };
}

export function installCommand(pm: PackageManager, deps: string[]): string {
  const { cmd, args } = installArgs(pm, deps);
  return [cmd, ...args].join(" ");
}

/** Same as installCommand, for a dev dependency. */
export function installDevCommand(pm: PackageManager, deps: string[]): string {
  const { cmd, args } = installArgs(pm, deps);
  return [cmd, args[0], pm === "bun" ? "--dev" : "-D", ...args.slice(1)].join(" ");
}

// npm package name, optionally followed by a simple version (no spaces or shell characters).
const SPEC_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[A-Za-z0-9.^~*+-]+)?$/;

/** Throws when a dependency from the registry is not a plain npm package spec. */
export function assertValidSpec(spec: string): void {
  if (!SPEC_RE.test(spec)) throw new CliError(`Refusing to install "${spec}": not a valid npm package name.`);
}

/** "framer-motion@13" -> "framer-motion", "@scope/pkg@1" -> "@scope/pkg". */
export function packageName(spec: string): string {
  const at = spec.indexOf("@", 1);
  return at === -1 ? spec : spec.slice(0, at);
}
