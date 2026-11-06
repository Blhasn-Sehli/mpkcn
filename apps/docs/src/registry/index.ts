import data from "./registry.json";

/** One source file of a registry item. */
export type RegistryFile = {
  /** Source file, relative to src/registry. */
  path: string;
  /** Where the CLI writes it, relative to the user's components folder. */
  target: string;
};

/** A component (or the theme) that `npx mpkcn add <name>` can install. */
export type RegistryItem = {
  /** Install name, e.g. "boot-screen". */
  name: string;
  /** Display title, e.g. "Boot Screen". */
  title: string;
  /** One sentence. */
  description: string;
  /** npm packages it needs, e.g. ["next-themes"]. */
  dependencies: string[];
  /** Other mpkcn items it needs, e.g. ["theme"]. */
  registryDependencies: string[];
  files: RegistryFile[];
};

/**
 * Every installable item. The single source of truth is ./registry.json, which
 * scripts/build-registry.mjs also reads to write public/r/*.json.
 */
export const registry: RegistryItem[] = data;

/** Looks up an item by name. */
export function getRegistryItem(name: string): RegistryItem | undefined {
  return registry.find((item) => item.name === name);
}
