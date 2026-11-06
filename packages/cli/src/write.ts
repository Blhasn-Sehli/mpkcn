import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CliError } from "./errors.js";
import type { RegistryItem } from "./registry.js";

/**
 * Returns the absolute path for `target` inside `dir`, or throws if the target
 * is absolute or would land outside `dir` (path traversal).
 */
export function safeTargetPath(dir: string, target: string): string {
  if (
    target.length === 0 ||
    target.includes("\0") ||
    path.isAbsolute(target) ||
    path.posix.isAbsolute(target) ||
    path.win32.isAbsolute(target)
  ) {
    throw new CliError(`Refusing to write unsafe file target "${target}".`);
  }
  const root = path.resolve(dir);
  const resolved = path.resolve(root, target);
  const rel = path.relative(root, resolved);
  if (rel === "" || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new CliError(`Refusing to write "${target}": it points outside ${root}.`);
  }
  return resolved;
}

export type WriteResult = { path: string; status: "created" | "overwritten" | "skipped" };

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Writes every file of every item into `dir`. All targets are validated before anything is written. */
export async function writeItems(
  items: RegistryItem[],
  dir: string,
  opts: { overwrite: boolean },
): Promise<WriteResult[]> {
  const planned = items.flatMap((item) =>
    item.files.map((f) => ({ path: safeTargetPath(dir, f.target), content: f.content })),
  );

  const results: WriteResult[] = [];
  const seen = new Set<string>();
  for (const file of planned) {
    if (seen.has(file.path)) continue;
    seen.add(file.path);
    const already = await exists(file.path);
    if (already && !opts.overwrite) {
      results.push({ path: file.path, status: "skipped" });
      continue;
    }
    await mkdir(path.dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, "utf8");
    results.push({ path: file.path, status: already ? "overwritten" : "created" });
  }
  return results;
}
