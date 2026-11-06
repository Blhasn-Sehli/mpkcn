import { CaseCard, type CaseCardProps } from "@/registry/case-card";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos`;

/** A CaseCard for a made-up project: text, tags and links on the left, a feature sheet on the right. */
export function CaseCardDemo({ compact = false, ...props }: Partial<CaseCardProps> & { compact?: boolean }) {
  return (
    <div className="w-full">
      <CaseCard
        index="01"
        title="Atlas"
        subtitle="Offline map viewer · 2026"
        description="Streams vector tiles, caches them in the browser and keeps working on a plane."
        role={compact ? undefined : "Designed and built it solo: tile cache, search and the share links."}
        tags={compact ? ["Next.js", "MapLibre"] : ["Next.js", "MapLibre", "IndexedDB", "Workers"]}
        links={[
          { label: "code", href: "https://github.com", ariaLabel: "Atlas source code" },
          { label: "demo", href: "#atlas", ariaLabel: "Atlas live demo" },
        ]}
        image={compact ? undefined : { src: `${BASE}/sample-dunes.svg`, alt: "Atlas map view" }}
        features={
          compact
            ? undefined
            : [
                { label: "Tiles", value: "vector, z0–14" },
                { label: "Cache", value: "IndexedDB, 50 MB" },
                { label: "Search", value: "local, fuzzy" },
                { label: "First load", value: "< 1 s on 4G" },
                { label: "Bundle", value: "92 kB gz" },
              ]
        }
        className={compact ? "py-6" : undefined}
        {...props}
      />
    </div>
  );
}
