import type { Metadata } from "next";
import Link from "next/link";
import { ComponentsGallery, type GalleryItem } from "@/components/components-gallery";
import { ArrowRightIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { categoryRank, getComponentCategory, type ComponentCategory } from "@/lib/component-categories";
import { highlight } from "@/lib/highlight";
import { readRegistryFile } from "@/lib/registry-source";
import { registry, SETUP_ITEMS } from "@/registry";

const description =
  "Every mpkcn component, running live. Preview them, read the source, and copy the one you want with a single command.";

export const metadata: Metadata = {
  title: "Components",
  description,
  alternates: { canonical: "components/" },
  openGraph: { title: "Components — mpkcn", description, url: "components/" },
};

/** Registry items (minus the setup items), with every file read and highlighted at build time. */
async function getGalleryItems(): Promise<GalleryItem[]> {
  const components = registry.filter((item) => !SETUP_ITEMS.has(item.name));
  const items = await Promise.all(
    components.map(async (item) => ({
      name: item.name,
      title: item.title,
      description: item.description,
      category: getComponentCategory(item.name),
      dependencies: item.dependencies,
      files: await Promise.all(
        item.files.map(async (file) => {
          const code = readRegistryFile(file.path).replace(/\r\n/g, "\n").replace(/\n$/, "");
          const lang = file.path.split(".").pop();
          return { target: file.target, code, html: await highlight(code, lang) };
        }),
      ),
    })),
  );
  // Stable sort: by category (chip order), then registry order.
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => categoryRank(a.item.category) - categoryRank(b.item.category) || a.i - b.i)
    .map(({ item }) => item);
}

export default async function ComponentsPage() {
  const items = await getGalleryItems();
  const categories = [...new Set(items.map((item) => item.category))].sort(
    (a, b) => categoryRank(a) - categoryRank(b),
  ) as ComponentCategory[];

  return (
    <>
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mpk-mono text-xs text-mpk-amber">$ mpkcn list</p>
            <h1 className="mt-3 text-[2.25rem] leading-tight font-semibold tracking-tight text-mpk-ink sm:text-5xl">
              Components
            </h1>
            <p className="mt-4 text-base leading-7 text-mpk-dim sm:text-lg sm:leading-8">{description}</p>
          </div>
          <p className="max-w-sm text-sm leading-6 text-mpk-dim">
            New here? Set up the theme once, then add components as you need them.{" "}
            <Link
              href="/docs/installation/"
              className="inline-flex items-center gap-1 text-mpk-blue underline-offset-4 hover:underline"
            >
              Installation <ArrowRightIcon width={12} height={12} />
            </Link>
          </p>
        </header>

        <ComponentsGallery items={items} categories={categories} />
      </main>
      <SiteFooter />
    </>
  );
}
