import { ImagePlaceholder } from "@/registry/image-placeholder";

const SAMPLE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/demos/sample-landscape.svg`;

/** An empty slot next to a loaded image (and, full size, a broken URL that falls back). */
export function ImagePlaceholderDemo({ compact = false }: { compact?: boolean }) {
  const cell = "flex flex-col items-center gap-2";
  const caption = "font-mpk-mono text-[11px] text-mpk-dim2";
  return (
    <div className={`grid w-full gap-4 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
      <div className={cell}>
        <ImagePlaceholder alt="Project screenshot" className="w-full" />
        <span className={caption}>no src</span>
      </div>
      <div className={cell}>
        <ImagePlaceholder src={SAMPLE} alt="Mountains at dusk, flat illustration" className="w-full" />
        <span className={caption}>src loaded</span>
      </div>
      {!compact && (
        <div className={cell}>
          <ImagePlaceholder src="data:image/png;base64,AAAA" alt="Broken image" label="load failed: fallback shown" className="w-full" />
          <span className={caption}>broken src</span>
        </div>
      )}
    </div>
  );
}
