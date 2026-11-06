import { existsSync } from "node:fs";
import path from "node:path";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

const LOCKFILES: [string, PackageManager][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
];

/** Picks the package manager from the lockfile in `cwd`; npm when none is found. */
export function detectPackageManager(cwd: string): PackageManager {
  for (const [file, pm] of LOCKFILES) {
    if (existsSync(path.join(cwd, file))) return pm;
  }
  return "npm";
}

export function installCommand(pm: PackageManager, deps: string[]): string {
  const verb = pm === "npm" ? "install" : "add";
  return [pm, verb, ...deps].join(" ");
}
