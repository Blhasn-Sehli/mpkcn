// Builds the static registry the mpkcn CLI downloads from:
//   public/r/index.json   -> { name, title, description, category, dependencies, registryDependencies }[]
//   public/r/<name>.json  -> item metadata + files: { target, content }[], plus category,
//                            the docs URL and the usage example from the docs page (for `mpkcn mcp`)
// Source of truth: src/registry/registry.json (also imported by src/registry/index.ts).
// The gallery categories come from src/lib/component-categories.ts, the usage example
// from the first code block under "## Usage" in src/content/docs/<name>.mdx.
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(root, "src", "registry");
const outDir = path.join(root, "public", "r");

const items = JSON.parse(await readFile(path.join(registryDir, "registry.json"), "utf8"));
const siteUrl = /url:\s*"([^"]+)"/.exec(await readFile(path.join(root, "src", "lib", "site.ts"), "utf8"))?.[1];
if (!siteUrl) throw new Error("could not read the site url from src/lib/site.ts");

// "boot-screen": "Intro & loaders", from the gallery's category map.
const categoriesTs = await readFile(path.join(root, "src", "lib", "component-categories.ts"), "utf8");
const categories = new Map(
  [...categoriesTs.matchAll(/^\s*"?([a-z0-9-]+)"?\s*:\s*"([^"]+)",?\s*$/gm)].map((m) => [m[1], m[2]]),
);
const SETUP = new Set(["theme", "theme-provider"]);
const categoryOf = (name) => (SETUP.has(name) ? "Setup" : (categories.get(name) ?? "Other"));

const docsOf = (name) =>
  name === "theme"
    ? `${siteUrl}/docs/theming/`
    : name === "theme-provider"
      ? `${siteUrl}/docs/installation/`
      : `${siteUrl}/docs/components/${name}/`;

/** First fenced code block under "## Usage" in the component's docs page. */
async function usageOf(name) {
  const file = path.join(root, "src", "content", "docs", `${name}.mdx`);
  if (!existsSync(file)) return undefined;
  const mdx = (await readFile(file, "utf8")).replace(/\r\n/g, "\n");
  const section = /^## Usage\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(mdx)?.[1] ?? "";
  return /^```[a-z]*\n([\s\S]*?)^```/m.exec(section)?.[1];
}

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
  const usage = await usageOf(item.name);
  await write(`${item.name}.json`, {
    name: item.name,
    title: item.title,
    description: item.description,
    category: categoryOf(item.name),
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    docs: docsOf(item.name),
    ...(usage ? { usage } : {}),
    files,
  });
}

await write(
  "index.json",
  items.map(({ name, title, description, dependencies, registryDependencies }) => ({
    name,
    title,
    description,
    category: categoryOf(name),
    dependencies,
    registryDependencies,
  })),
);

console.log(`registry: wrote ${items.length + 1} files to ${path.relative(root, outDir)}`);
