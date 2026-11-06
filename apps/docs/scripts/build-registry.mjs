// Builds the static registry the mpkcn CLI downloads from:
//   public/r/index.json   -> { name, title, description }[]
//   public/r/<name>.json  -> item metadata + files: { target, content }[]
// Source of truth: src/registry/registry.json (also imported by src/registry/index.ts).
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(root, "src", "registry");
const outDir = path.join(root, "public", "r");

const items = JSON.parse(await readFile(path.join(registryDir, "registry.json"), "utf8"));

const names = new Set();
for (const item of items) {
  for (const key of ["name", "title", "description"]) {
    if (typeof item[key] !== "string" || !item[key]) throw new Error(`registry item is missing "${key}": ${JSON.stringify(item)}`);
  }
  if (!/^[a-z0-9-]+$/.test(item.name)) throw new Error(`invalid item name "${item.name}"`);
  if (names.has(item.name)) throw new Error(`duplicate item name "${item.name}"`);
  names.add(item.name);
}
for (const item of items) {
  for (const dep of item.registryDependencies) {
    if (!names.has(dep)) throw new Error(`${item.name}: unknown registry dependency "${dep}"`);
  }
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const write = (file, data) => writeFile(path.join(outDir, file), JSON.stringify(data, null, 2) + "\n", "utf8");

for (const item of items) {
  const files = await Promise.all(
    item.files.map(async (f) => ({
      target: f.target,
      content: (await readFile(path.join(registryDir, f.path), "utf8")).replace(/\r\n/g, "\n"),
    })),
  );
  await write(`${item.name}.json`, {
    name: item.name,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    files,
  });
}

await write(
  "index.json",
  items.map(({ name, title, description }) => ({ name, title, description })),
);

console.log(`registry: wrote ${items.length + 1} files to ${path.relative(root, outDir)}`);
