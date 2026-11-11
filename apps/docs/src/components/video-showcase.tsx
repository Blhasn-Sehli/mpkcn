"use client";

import { useEffect, useRef, useState } from "react";

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/media`;

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      {on ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /> : <path d="M16 9l5 6M21 9l-5 6" />}
    </svg>
  );
}

type AutoVideoProps = {
  /** File name in /public/media without extension; expects <name>.mp4 and <name>.jpg. */
  name: string;
  /** Short label shown in the window bar. */
  title: string;
  /** The clip has narration: start muted and offer a sound button. */
  voiced?: boolean;
  /** Accessible description of the video. */
  label: string;
};

/**
 * A video in a terminal frame that starts playing (muted) when it scrolls into view
 * and pauses when it leaves. Browsers never allow autoplay with sound, so voiced
 * clips show a "tap for sound" button. Native controls stay available for pausing.
 */
export function AutoVideo({ name, title, voiced = false, label }: AutoVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.45 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next) {
      if (v.ended || v.currentTime > v.duration - 1) v.currentTime = 0;
      void v.play().catch(() => {});
    }
  };

  return (
    <div className="border border-mpk-line bg-mpk-bg-soft">
      <div className="flex items-center justify-between gap-3 border-b border-mpk-line px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2" aria-hidden="true">
          <span className="size-2.5 shrink-0 bg-mpk-amber" />
          <span className="size-2.5 shrink-0 bg-mpk-dim2" />
          <span className="size-2.5 shrink-0 bg-mpk-blue" />
          <span className="ml-2 truncate font-mpk-mono text-[11px] text-mpk-dim2">{title}</span>
        </div>
        {voiced && (
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            className={`flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mpk-mono text-[12px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-blue ${
              muted ? "border-mpk-amber bg-mpk-amber text-mpk-bg hover:opacity-90" : "border-mpk-line text-mpk-dim hover:text-mpk-ink"
            }`}
          >
            <SoundIcon on={!muted} />
            {muted ? "tap for sound" : "sound on"}
          </button>
        )}
      </div>
      <div className="relative aspect-video w-full bg-mpk-bg">
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full"
          src={`${BASE}/${name}.mp4`}
          poster={`${BASE}/${name}.jpg`}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          controls
          aria-label={label}
        />
      </div>
    </div>
  );
}
