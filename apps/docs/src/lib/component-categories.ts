/** Gallery categories, in the order the filter chips show them. */
export const COMPONENT_CATEGORIES = ["Intro & loaders", "Terminal", "Effects", "Text & layout", "Theme"] as const;

export type KnownCategory = (typeof COMPONENT_CATEGORIES)[number];

/** Every category a card can have: a known one, or "Other" for names not in the map yet. */
export type ComponentCategory = KnownCategory | "Other";

/** Category of each registry component, by its install name. */
export const componentCategories: Record<string, KnownCategory> = {
  "boot-screen": "Intro & loaders",
  "theme-toggle": "Theme",
  reveal: "Effects",
  "terminal-window": "Terminal",
  "terminal-shell": "Terminal",
  "command-palette": "Terminal",
  "shortcuts-dialog": "Terminal",
  "tmux-bar": "Terminal",
  "terminal-form": "Terminal",
  "konami": "Terminal",
  "cursor": "Effects",
  "grain": "Effects",
  "spotlight": "Effects",
  "scene-canvas": "Effects",
  "ascii-image": "Effects",
  "letter-reveal": "Effects",
  "scroll-progress": "Text & layout",
  "back-to-top": "Text & layout",
  "kbd": "Text & layout",
  "eyebrow": "Text & layout",
  "section-divider": "Text & layout",
  "section-rail": "Text & layout",
  "image-placeholder": "Text & layout",
  "feature-list": "Text & layout",
};

/** Category for a registry name; unknown names land in "Other". */
export function getComponentCategory(name: string): ComponentCategory {
  return componentCategories[name] ?? "Other";
}

/** Sort key: known categories first (in chip order), "Other" last. */
export function categoryRank(category: ComponentCategory): number {
  const i = (COMPONENT_CATEGORIES as readonly string[]).indexOf(category);
  return i === -1 ? COMPONENT_CATEGORIES.length : i;
}
