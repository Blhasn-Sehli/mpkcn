"use client";

import { useState } from "react";
import { BootScreen, type BootScreenProps } from "@/registry/boot-screen";
import { ReplayIcon } from "../icons";
import { ReducedMotionNote, usePrefersReducedMotion } from "./reduced-motion";

type Props = Omit<BootScreenProps, "fullscreen" | "oncePerSession" | "onDone" | "ignoreReducedMotion"> & {
  height?: number;
};

/** BootScreen inside a box, with a Replay button that remounts it. */
export function BootScreenDemo({ height = 420, user = "guest", host = "mpkcn.dev", ...props }: Props) {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const [force, setForce] = useState(false);
  const reduced = usePrefersReducedMotion();
  const replay = () => {
    setDone(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="relative w-full overflow-hidden border border-mpk-line bg-mpk-bg" style={{ height }}>
      {/* What sits "behind" the boot screen once it is gone */}
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 p-6 font-mpk-mono text-[13px] sm:p-10">
        <p className="text-mpk-dim">
          <span className="text-mpk-blue">
            {user}@{host}
          </span>
          <span className="text-mpk-dim2">:</span>
          <span className="text-mpk-amber">~</span>
          <span className="text-mpk-dim2">$</span> session started
        </p>
        <p className="text-mpk-dim">
          <span className="text-mpk-blue">
            {user}@{host}
          </span>
          <span className="text-mpk-dim2">:</span>
          <span className="text-mpk-amber">~</span>
          <span className="text-mpk-dim2">$</span>{" "}
          <span aria-hidden="true" className="inline-block h-[1.1em] w-[0.55em] translate-y-[2px] animate-mpk-blink bg-mpk-ink" />
        </p>
      </div>

      <BootScreen
        key={run}
        {...props}
        user={user}
        host={host}
        fullscreen={false}
        oncePerSession={false}
        ignoreReducedMotion={force}
        onDone={() => setDone(true)}
      />

      <button
        type="button"
        onClick={replay}
        className={`absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 border border-mpk-line bg-mpk-bg px-2.5 py-1 font-mpk-mono text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue ${
          done ? "" : "opacity-80"
        }`}
      >
        <ReplayIcon width={12} height={12} />
        replay
      </button>

      {reduced && !force && (
        <ReducedMotionNote
          className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)]"
          onPlay={() => {
            setForce(true);
            replay();
          }}
        />
      )}
    </div>
  );
}
