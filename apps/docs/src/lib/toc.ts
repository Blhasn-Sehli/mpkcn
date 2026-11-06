import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_ROOT } from "./app-root";
import { docs } from "./docs";

export type TocItem = { id: string; text: string; level: 2 | 3 };

export type SearchEntry = {
  title: string;
  href: string;
  section: string;
  /** Page title when the entry is a heading inside a page */
  page?: string;
};

const CONTENT_DIR = path.join(APP_ROOT, "src", "content", "docs");

/** Same rules as github-slugger (used by rehype-slug) for the text we write. */
function createSlugger() {
  const occurrences = new Map<string, number>();
  return (text: string) => {
    const original = text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
      .replace(/ /g, "-");
    let result = original;
    while (occurrences.has(result)) {
      const n = (occurrences.get(original) ?? 0) + 1;
      occurrences.set(original, n);
      result = `${original}-${n}`;
    }
    occurrences.set(result, 0);
    return result;
  };
}

/** Turns inline markdown into the plain text rehype-slug sees. */
function plain(md: string) {
  return md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

export function getHeadings(slug: string): TocItem[] {
  let source: string;
  try {
    source = readFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return [];
  }
  const slugger = createSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^\s*(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = plain(m[2]);
    const id = slugger(text);
    const level = m[1].length;
    if (level === 2 || level === 3) items.push({ id, text, level });
  }
  return items;
}

export function getSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [
    { title: "Home", href: "/", section: "Pages" },
  ];
  for (const doc of docs) {
    entries.push({ title: doc.title, href: doc.href, section: doc.section });
  }
  for (const doc of docs) {
    for (const h of getHeadings(doc.slug)) {
      entries.push({ title: h.text, href: `${doc.href}#${h.id}`, section: "Headings", page: doc.title });
    }
  }
  return entries;
}
