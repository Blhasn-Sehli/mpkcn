import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Absolute path of apps/docs. `next build` runs from this folder, but `next dev`
 * can be started from a parent (e.g. `next dev mpkcn/apps/docs`), so look around.
 */
function findAppRoot(): string {
  const cwd = process.cwd();
  const candidates = [cwd, path.join(cwd, "apps", "docs"), path.join(cwd, "mpkcn", "apps", "docs")];
  return candidates.find((dir) => existsSync(path.join(dir, "src", "content", "docs"))) ?? cwd;
}

export const APP_ROOT = findAppRoot();
