const CHARS = "01アイウエオカキクケコ<>/{}$#";
const SIZE = 16;
const TICK_MS = 45;

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/**
 * Rough check for weak devices: few CPU cores, little memory, or data saver on.
 * Also honours `<html data-perf="low">` if the app sets it.
 */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.documentElement.dataset.perf === "low") return true;
    const n = navigator as NavigatorWithHints;
    return Boolean(
      (n.hardwareConcurrency && n.hardwareConcurrency <= 4) ||
        (n.deviceMemory && n.deviceMemory <= 4) ||
        n.connection?.saveData,
    );
  } catch {
    return false;
  }
}

function cssVar(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/**
 * Draws matrix rain on the canvas until the returned stop function is called.
 * The canvas is sized to its parent element (and follows it on resize);
 * glyphs use `--mpk-blue`, the trail fades into `--mpk-bg`.
 */
export function startMatrixRain(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const host = canvas.parentElement ?? canvas;
  const ink = cssVar(canvas, "--mpk-blue", "#6fb2ff");
  const bg = cssVar(canvas, "--mpk-bg", "#0a0d10");
  let drops: number[] = [];

  const resize = () => {
    const w = Math.max(1, Math.round(host.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.round(host.clientHeight || window.innerHeight));
    canvas.width = w;
    canvas.height = h;
    const cols = Math.ceil(w / SIZE);
    drops = Array.from({ length: cols }, (_, i) => drops[i] ?? Math.random() * -50);
  };
  resize();

  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(host);

  const timer = window.setInterval(() => {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    ctx.font = `${SIZE}px "JetBrains Mono", ui-monospace, monospace`;
    drops.forEach((y, x) => {
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x * SIZE, y * SIZE);
      drops[x] = y * SIZE > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }, TICK_MS);

  return () => {
    window.clearInterval(timer);
    observer?.disconnect();
  };
}
