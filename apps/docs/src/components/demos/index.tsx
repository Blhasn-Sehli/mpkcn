"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export type DemoProps = {
  /** Smaller version for a gallery card (about 264px high). */
  compact?: boolean;
};

/** Shown while a demo's code chunk loads. */
function DemoLoading() {
  return (
    <p className="font-mpk-mono text-[11px] text-mpk-dim2">
      <span className="text-mpk-amber">$</span> loading demo…
    </p>
  );
}

/**
 * Live demo for each registry component, by install name. Each one is code-split
 * (next/dynamic), so the gallery only downloads the demos that scroll into view.
 */
export const demos: Record<string, ComponentType<DemoProps>> = {
  "boot-screen": dynamic<DemoProps>(
    () =>
      import("./boot-screen-demo").then(({ BootScreenDemo }) => {
        function BootScreenGalleryDemo({ compact }: DemoProps) {
          return <BootScreenDemo height={compact ? 264 : 420} />;
        }
        return BootScreenGalleryDemo;
      }),
    { loading: DemoLoading },
  ),
  "theme-toggle": dynamic<DemoProps>(
    () =>
      import("./theme-toggle-demo").then(({ ThemeToggleDemo }) => {
        function ThemeToggleGalleryDemo() {
          return <ThemeToggleDemo />;
        }
        return ThemeToggleGalleryDemo;
      }),
    { loading: DemoLoading },
  ),
  reveal: dynamic<DemoProps>(
    () =>
      import("./reveal-demo").then(({ RevealDemo }) => {
        function RevealGalleryDemo({ compact }: DemoProps) {
          return <RevealDemo compact={compact} limit={compact ? 2 : undefined} stagger={0.1} />;
        }
        return RevealGalleryDemo;
      }),
    { loading: DemoLoading },
  ),
  "ascii-image": dynamic<DemoProps>(
    () => import("./ascii-image-demo").then(({ AsciiImageDemo }) => {
      function AsciiImageGalleryDemo({ compact }: DemoProps) {
        return <AsciiImageDemo compact={compact} />;
      }
      return AsciiImageGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "back-to-top": dynamic<DemoProps>(
    () => import("./back-to-top-demo").then(({ BackToTopDemo }) => {
      function BackToTopGalleryDemo({ compact }: DemoProps) {
        return <BackToTopDemo compact={compact} />;
      }
      return BackToTopGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "command-palette": dynamic<DemoProps>(
    () => import("./command-palette-demo").then(({ CommandPaletteDemo }) => {
      function CommandPaletteGalleryDemo({ compact }: DemoProps) {
        return <CommandPaletteDemo compact={compact} />;
      }
      return CommandPaletteGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "cursor": dynamic<DemoProps>(
    () => import("./cursor-demo").then(({ CursorDemo }) => {
      function CursorGalleryDemo({ compact }: DemoProps) {
        return <CursorDemo compact={compact} />;
      }
      return CursorGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "eyebrow": dynamic<DemoProps>(
    () => import("./eyebrow-demo").then(({ EyebrowDemo }) => {
      function EyebrowGalleryDemo({ compact }: DemoProps) {
        return <EyebrowDemo compact={compact} />;
      }
      return EyebrowGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "feature-list": dynamic<DemoProps>(
    () => import("./feature-list-demo").then(({ FeatureListDemo }) => {
      function FeatureListGalleryDemo({ compact }: DemoProps) {
        return <FeatureListDemo compact={compact} />;
      }
      return FeatureListGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "grain": dynamic<DemoProps>(
    () => import("./grain-demo").then(({ GrainDemo }) => {
      function GrainGalleryDemo({ compact }: DemoProps) {
        return <GrainDemo compact={compact} />;
      }
      return GrainGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "image-placeholder": dynamic<DemoProps>(
    () => import("./image-placeholder-demo").then(({ ImagePlaceholderDemo }) => {
      function ImagePlaceholderGalleryDemo({ compact }: DemoProps) {
        return <ImagePlaceholderDemo compact={compact} />;
      }
      return ImagePlaceholderGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "kbd": dynamic<DemoProps>(
    () => import("./kbd-demo").then(({ KbdDemo }) => {
      function KbdGalleryDemo({ compact }: DemoProps) {
        return <KbdDemo compact={compact} />;
      }
      return KbdGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "konami": dynamic<DemoProps>(
    () => import("./konami-demo").then(({ KonamiDemo }) => {
      function KonamiGalleryDemo({ compact }: DemoProps) {
        return <KonamiDemo compact={compact} />;
      }
      return KonamiGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "letter-reveal": dynamic<DemoProps>(
    () => import("./letter-reveal-demo").then(({ LetterRevealDemo }) => {
      function LetterRevealGalleryDemo({ compact }: DemoProps) {
        return <LetterRevealDemo compact={compact} />;
      }
      return LetterRevealGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "scene-canvas": dynamic<DemoProps>(
    () => import("./scene-canvas-demo").then(({ SceneCanvasDemo }) => {
      function SceneCanvasGalleryDemo({ compact }: DemoProps) {
        return <SceneCanvasDemo compact={compact} />;
      }
      return SceneCanvasGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "scroll-progress": dynamic<DemoProps>(
    () => import("./scroll-progress-demo").then(({ ScrollProgressDemo }) => {
      function ScrollProgressGalleryDemo({ compact }: DemoProps) {
        return <ScrollProgressDemo compact={compact} />;
      }
      return ScrollProgressGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "section-divider": dynamic<DemoProps>(
    () => import("./section-divider-demo").then(({ SectionDividerDemo }) => {
      function SectionDividerGalleryDemo({ compact }: DemoProps) {
        return <SectionDividerDemo compact={compact} />;
      }
      return SectionDividerGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "section-rail": dynamic<DemoProps>(
    () => import("./section-rail-demo").then(({ SectionRailDemo }) => {
      function SectionRailGalleryDemo({ compact }: DemoProps) {
        return <SectionRailDemo compact={compact} />;
      }
      return SectionRailGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "shortcuts-dialog": dynamic<DemoProps>(
    () => import("./shortcuts-dialog-demo").then(({ ShortcutsDialogDemo }) => {
      function ShortcutsDialogGalleryDemo({ compact }: DemoProps) {
        return <ShortcutsDialogDemo compact={compact} />;
      }
      return ShortcutsDialogGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "spotlight": dynamic<DemoProps>(
    () => import("./spotlight-demo").then(({ SpotlightDemo }) => {
      function SpotlightGalleryDemo({ compact }: DemoProps) {
        return <SpotlightDemo compact={compact} />;
      }
      return SpotlightGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "terminal-form": dynamic<DemoProps>(
    () => import("./terminal-form-demo").then(({ TerminalFormDemo }) => {
      function TerminalFormGalleryDemo({ compact }: DemoProps) {
        return <TerminalFormDemo compact={compact} />;
      }
      return TerminalFormGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "terminal-shell": dynamic<DemoProps>(
    () => import("./terminal-shell-demo").then(({ TerminalShellDemo }) => {
      function TerminalShellGalleryDemo({ compact }: DemoProps) {
        return <TerminalShellDemo compact={compact} />;
      }
      return TerminalShellGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "terminal-window": dynamic<DemoProps>(
    () => import("./terminal-window-demo").then(({ TerminalWindowDemo }) => {
      function TerminalWindowGalleryDemo({ compact }: DemoProps) {
        return <TerminalWindowDemo compact={compact} />;
      }
      return TerminalWindowGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
  "tmux-bar": dynamic<DemoProps>(
    () => import("./tmux-bar-demo").then(({ TmuxBarDemo }) => {
      function TmuxBarGalleryDemo({ compact }: DemoProps) {
        return <TmuxBarDemo compact={compact} />;
      }
      return TmuxBarGalleryDemo;
    }),
    { loading: DemoLoading },
  ),
};
