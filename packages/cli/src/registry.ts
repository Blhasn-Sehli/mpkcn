import { readFile } from "node:fs/promises";
import path from "node:path";
import { CliError } from "./errors.js";

export const DEFAULT_REGISTRY = "https://blhasn-sehli.github.io/mpkcn/r";

export type RegistryIndexEntry = { name: string; title: string; description: string };

export type RegistryItemFile = { target: string; content: string };

export type RegistryItem = {
  name: string;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryItemFile[];
};

const NAME_RE = /^[a-z0-9-]+$/;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

export function assertValidName(name: string): void {
  if (!isValidName(name)) {
    throw new CliError(`Invalid item name "${name}". Names may only contain a-z, 0-9 and "-".`);
  }
}

export function isRemote(registry: string): boolean {
  return /^https?:\/\//i.test(registry);
}

/** Reads `<registry>/<file>` as JSON from an http(s) URL or a local folder. */
export async function readRegistryJson(registry: string, file: string, cwd: string): Promise<unknown> {
  if (isRemote(registry)) {
    const url = `${registry.replace(/\/+$/, "")}/${file}`;
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      const cause = (err as { cause?: { message?: string } }).cause?.message;
      throw new CliError(`Could not reach the registry at ${url}: ${cause ?? (err as Error).message}`);
    }
    if (res.status === 404) throw new CliError(`Not found in registry: ${url}`);
    if (!res.ok) throw new CliError(`Registry request failed (${res.status} ${res.statusText}): ${url}`);
    try {
      return await res.json();
    } catch {
      throw new CliError(`Registry returned invalid JSON: ${url}`);
    }
  }

  const filePath = path.join(path.resolve(cwd, registry), file);
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new CliError(`Not found in registry: ${filePath}`);
    }
    throw new CliError(`Could not read ${filePath}: ${(err as Error).message}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new CliError(`Registry file is not valid JSON: ${filePath}`);
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string");

export function parseItem(data: unknown, expectedName: string): RegistryItem {
  const bad = (why: string) => new CliError(`Registry item "${expectedName}" is malformed: ${why}.`);
  if (typeof data !== "object" || data === null) throw bad("not an object");
  const d = data as Record<string, unknown>;
  if (d.name !== expectedName) throw bad(`name is ${JSON.stringify(d.name)}`);
  const deps = d.dependencies ?? [];
  const regDeps = d.registryDependencies ?? [];
  if (!isStringArray(deps)) throw bad("dependencies must be a string array");
  if (!isStringArray(regDeps)) throw bad("registryDependencies must be a string array");
  if (!Array.isArray(d.files)) throw bad("files must be an array");
  const files = d.files.map((f: unknown) => {
    const file = f as Record<string, unknown> | null;
    if (!file || typeof file.target !== "string" || typeof file.content !== "string") {
      throw bad("each file needs a string target and content");
    }
    return { target: file.target, content: file.content };
  });
  return {
    name: expectedName,
    title: typeof d.title === "string" ? d.title : expectedName,
    description: typeof d.description === "string" ? d.description : "",
    dependencies: deps,
    registryDependencies: regDeps,
    files,
  };
}

export async function fetchItem(registry: string, name: string, cwd: string): Promise<RegistryItem> {
  assertValidName(name);
  return parseItem(await readRegistryJson(registry, `${name}.json`, cwd), name);
}

export async function fetchIndex(registry: string, cwd: string): Promise<RegistryIndexEntry[]> {
  const data = await readRegistryJson(registry, "index.json", cwd);
  if (!Array.isArray(data)) throw new CliError("Registry index.json must be an array.");
  return data.map((e: unknown) => {
    const entry = (e ?? {}) as Record<string, unknown>;
    if (typeof entry.name !== "string") throw new CliError("Registry index.json has an entry without a name.");
    return {
      name: entry.name,
      title: typeof entry.title === "string" ? entry.title : entry.name,
      description: typeof entry.description === "string" ? entry.description : "",
    };
  });
}
