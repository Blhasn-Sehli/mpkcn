import type { RegistryItem } from "./registry.js";
import { assertValidName } from "./registry.js";

export type ItemFetcher = (name: string) => Promise<RegistryItem>;

/**
 * Resolves the requested items and their registryDependencies recursively.
 * Each item appears once; dependencies come before the items that need them.
 */
export async function resolveItems(names: string[], fetchItem: ItemFetcher): Promise<RegistryItem[]> {
  const ordered: RegistryItem[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const cache = new Map<string, Promise<RegistryItem>>();

  const get = (name: string) => {
    let p = cache.get(name);
    if (!p) {
      p = fetchItem(name);
      cache.set(name, p);
    }
    return p;
  };

  const visit = async (name: string): Promise<void> => {
    assertValidName(name);
    if (done.has(name) || visiting.has(name)) return; // already added, or a cycle
    visiting.add(name);
    const item = await get(name);
    for (const dep of item.registryDependencies) await visit(dep);
    visiting.delete(name);
    done.add(name);
    ordered.push(item);
  };

  for (const name of names) await visit(name);
  return ordered;
}

/** Unique npm dependencies across items, in first-seen order. */
export function collectDependencies(items: RegistryItem[]): string[] {
  return [...new Set(items.flatMap((i) => i.dependencies))];
}
