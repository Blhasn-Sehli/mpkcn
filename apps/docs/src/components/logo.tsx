import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="mpkcn home"
      className={`group inline-flex items-center font-mpk-mono text-[15px] font-semibold tracking-tight text-mpk-ink ${className}`}
    >
      <span>mpkcn</span>
      <span
        aria-hidden="true"
        className="ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[1px] animate-mpk-blink bg-mpk-amber"
      />
    </Link>
  );
}
