import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// GitHub Pages serves the site from /mpkcn; locally this stays empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Fully static site (GitHub Pages): `next build` writes everything to out/.
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Cache Components is off: in Next 16.4 it turns on Partial Prerendering,
  // which `next build` rejects in export mode ("PPR cannot be enabled in export
  // mode"). Every route here is fully static anyway, so nothing is lost.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    // Turbopack needs plugins referenced by name (they run in Rust land).
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
