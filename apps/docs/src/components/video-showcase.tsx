"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/media`;

type Clip = {
  id: "overview" | "walkthrough";
  label: string;
  meta: string;
  src: string;
  poster: string;
  /** Plays silently on a loop when visible (unless the visitor prefers reduced motion). */
  ambient: boolean;
};

const CLIPS: Clip[] = [
  { id: "overview", label: "Overview", meta: "37 s · silent", src: `${BASE}/overview.mp4`, poster: `${BASE}/overview.jpg`, ambient: true },
  { id: "walkthrough", label: "Walkthrough", meta: "48 s · with voice", src: `${BASE}/walkthrough.mp4`, poster: `${BASE}/walkthrough.jpg`, ambient: false },
];

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

/** Two promo videos in a terminal frame: a silent looping overview and a voiced walkthrough. */
export function VideoShowcase() {
  const [active, setActive] = useState<Clip["id"]>("overview");
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const clip = CLIPS.find((c) => c.id === active)!;
  const autoplay = clip.ambient && !reduced;

  // Ambient clip: play only while on screen, pause when scrolled away.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !autoplay) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, [autoplay, active]);

  const select = (id: Clip["id"]) => {
    setActive(id);
    setStarted(false);
  };

  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    v.muted = false;
    v.controls = true;
    void v.play().catch(() => {});
  };

  const showPlay = !autoplay && !started;

  return (
    <div className="border border-mpk-line bg-mpk-bg-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mpk-line px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 bg-mpk-amber" />
          <span className="size-2.5 bg-mpk-dim2" />
          <span className="size-2.5 bg-mpk-blue" />
          <span className="ml-2 font-mpk-mono text-[11px] text-mpk-dim2">~/mpkcn/media</span>
        </div>
        <div role="tablist" aria-label="Choose a video" className="flex gap-1">
          {CLIPS.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => select(c.id)}
                className={`flex items-baseline gap-2 border px-3 py-1.5 font-mpk-mono text-[12px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-blue ${
                  on ? "border-mpk-amber text-mpk-ink" : "border-transparent text-mpk-dim hover:text-mpk-ink"
                }`}
              >
                <span>{c.label}</span>
                <span className={`hidden text-[10px] sm:inline ${on ? "text-mpk-amber" : "text-mpk-dim2"}`}>{c.meta}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative aspect-video w-full bg-mpk-bg">
        <video
          key={clip.id}
          ref={videoRef}
          className="absolute inset-0 h-full w-full"
          src={clip.src}
          poster={clip.poster}
          muted={clip.ambient}
          loop={clip.ambient}
          playsInline
          preload={clip.ambient ? "auto" : "metadata"}
          controls={!clip.ambient && started}
          aria-label={clip.ambient ? "mpkcn overview video, silent" : "mpkcn walkthrough video with narration and captions"}
        />
        {showPlay && (
          <button
            type="button"
            onClick={start}
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-mpk-blue"
            aria-label={`Play the ${clip.label.toLowerCase()} video`}
          >
            <span className="flex items-center gap-3 border border-mpk-amber bg-mpk-bg/90 px-5 py-3 font-mpk-mono text-sm text-mpk-ink transition-colors group-hover:bg-mpk-amber group-hover:text-mpk-bg">
              <PlayIcon />
              play {clip.label.toLowerCase()} <span className="text-mpk-dim group-hover:text-mpk-bg">· {clip.meta}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
