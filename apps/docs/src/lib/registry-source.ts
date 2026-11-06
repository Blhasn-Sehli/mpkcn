import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_ROOT } from "./app-root";

const REGISTRY_DIR = path.join(APP_ROOT, "src", "registry");

/** Reads a registry file (e.g. "boot-screen.tsx") at build time. */
export function readRegistryFile(file: string): string {
  try {
    return readFileSync(path.join(REGISTRY_DIR, file), "utf8");
  } catch {
    return `// ${file} is not in src/registry yet.\n`;
  }
}

/** Source of a component by its registry name. */
export function readComponentSource(name: string): string {
  return readRegistryFile(`${name}.tsx`);
}
