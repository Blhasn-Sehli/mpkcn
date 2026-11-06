"use client";

import { MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";

export type SiteHeaderLink = {
  /** Text of the link, e.g. "docs". */
  label: string;
  /** Turns the item into a link. */
  href?: string;
  /** Turns the item into a button (or runs before the link is followed). */
  onSelect?: () => void;
  /** What `current` is compared with. @default href ?? label */
  id?: string;
};

/** Props your own link component receives when you pass `linkComponent` (next/link fits). */
export type SiteHeaderLinkComponentProps = {
  href: string;
  className?: string;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  "aria-current"?: "page";
  "aria-label"?: string;
};

export type SiteHeaderProps = {
  /** Logo slot: text, an image or any element. @default "~/" */
  logo?: ReactNode;
  /** Where the logo points. @default "/" */
  logoHref?: string;
  /** Accessible name of the logo link, when the logo is not plain text. */
  logoLabel?: string;
  /** A blinking block cursor after the logo (still under reduced motion). @default true */
  cursor?: boolean;
  /** Navigation links, left to right. */
  links: SiteHeaderLink[];
  /** The `id` (or `href`, or `label`) of the active link, which gets `aria-current="page"`. */
  current?: string;
  /** Show 01, 02… before each link. @default true */
  numbered?: boolean;
  /** Slot on the right for icon buttons, a theme toggle, a CTA… Shown at every width. */
  actions?: ReactNode;
  /** Extra content at the bottom of the mobile menu (social links, a CTA…). */
  menuFooter?: ReactNode;
  /** Your link component, e.g. next/link's `Link`, for client-side navigation. @default "a" */
  linkComponent?: ComponentType<SiteHeaderLinkComponentProps>;
  /** Stick to the top of the nearest scroll container. @default true */
  sticky?: boolean;
  /** Slide out when the window scrolls down, come back when it scrolls up. @default false */
  hideOnScroll?: boolean;
  /** Accessible name of the nav landmark. @default "Main" */
  navLabel?: string;
  /** Extra classes for the header. */
  className?: string;
};

const FOCUS = "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function keyOf(link: SiteHeaderLink): string {
  return link.id ?? link.href ?? link.label;
}

function pad(n: number): string {
  return String(n + 1).padStart(2, "0");
}

/**
 * A terminal-style site header: logo with a block cursor, numbered links with a
 * sliding active marker, an actions slot and a mobile menu that drops down under
 * the bar. It switches to the menu when the header itself is narrower than 672px
 * (a container query), so it also works inside narrow layouts.
 */
export function SiteHeader({
  logo = "~/",
  logoHref = "/",
  logoLabel,
  cursor = true,
  links,
  current,
  numbered = true,
  actions,
  menuFooter,
  linkComponent,
  sticky = true,
  hideOnScroll = false,
  navLabel = "Main",
  className,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const markerId = useId();
  const menuId = `${markerId}-menu`;

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) burgerRef.current?.focus();
  }, []);

  // Hide on scroll down, show on scroll up (window scroll only).
  useEffect(() => {
    if (!hideOnScroll) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setHidden(false);
      else if (y > last + 6) setHidden(true);
      else if (y < last - 6) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll]);

  // Mobile menu: focus the first item, Escape and outside clicks close it.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  const Link = linkComponent;
  const renderLink = (link: SiteHeaderLink, i: number, mobile: boolean) => {
    const active = current !== undefined && current === keyOf(link);
    const content = (
      <>
        {numbered && (
          <span
            className={cx(
              "font-mpk-mono text-[10.5px] transition-colors",
              active ? "text-mpk-amber" : "text-mpk-dim2 group-hover:text-mpk-amber",
            )}
          >
            {pad(i)}
          </span>
        )}
        <span>{link.label}</span>
        {mobile ? (
          <span aria-hidden="true" className="ml-auto font-mpk-mono text-[11px] text-mpk-dim2">
            {link.href ?? ""}
          </span>
        ) : (
          active && (
            <motion.span
              aria-hidden="true"
              layoutId={markerId}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-x-2 -bottom-px h-px bg-mpk-amber"
            />
          )
        )}
      </>
    );
    const cls = cx(
      "group relative flex items-baseline gap-2 transition-colors",
      mobile ? "w-full border-b border-mpk-line py-3 text-lg" : "px-2 py-2 text-[13px]",
      active ? "text-mpk-ink" : "text-mpk-dim hover:text-mpk-ink",
      FOCUS,
    );
    const onClick = () => {
      link.onSelect?.();
      if (mobile) close(false);
    };
    const ariaCurrent = active ? ("page" as const) : undefined;

    if (link.href) {
      return Link ? (
        <Link href={link.href} className={cls} onClick={onClick} aria-current={ariaCurrent}>
          {content}
        </Link>
      ) : (
        <a href={link.href} className={cls} onClick={onClick} aria-current={ariaCurrent}>
          {content}
        </a>
      );
    }
    return (
      <button type="button" className={cx("bg-transparent text-left", cls)} onClick={onClick} aria-current={ariaCurrent}>
        {content}
      </button>
    );
  };

  const logoContent = (
    <>
      {logo}
      {cursor && <span aria-hidden="true" className="ml-1 inline-block h-[1em] w-[0.5em] bg-mpk-amber animate-mpk-blink motion-reduce:animate-none" />}
    </>
  );
  const logoCls = cx("inline-flex shrink-0 items-center font-mpk-mono text-[15px] font-semibold text-mpk-ink transition-colors hover:text-mpk-blue", FOCUS);

  return (
    <MotionConfig reducedMotion="user">
      <header
        ref={rootRef}
        className={cx(
          "@container z-40 w-full border-b border-mpk-line bg-mpk-bg/85 backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          sticky ? "sticky top-0" : "relative",
          hidden && !open && "-translate-y-full",
          className,
        )}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 @2xl:px-6">
          {Link ? (
            <Link href={logoHref} className={logoCls} aria-label={logoLabel} onClick={() => close(false)}>
              {logoContent}
            </Link>
          ) : (
            <a href={logoHref} className={logoCls} aria-label={logoLabel} onClick={() => close(false)}>
              {logoContent}
            </a>
          )}

          <nav aria-label={navLabel} className="hidden @2xl:block">
            <ul className="m-0 flex list-none items-center gap-1 p-0">
              {links.map((link, i) => (
                <li key={keyOf(link)}>{renderLink(link, i, false)}</li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            {actions}
            <button
              ref={burgerRef}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => (open ? close(false) : setOpen(true))}
              className={cx("relative size-9 bg-transparent @2xl:hidden", FOCUS)}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "absolute inset-x-2.5 h-px bg-mpk-ink transition-transform duration-300 motion-reduce:transition-none",
                  open ? "top-[17.5px] rotate-45" : "top-[13px]",
                )}
              />
              <span
                aria-hidden="true"
                className={cx(
                  "absolute inset-x-2.5 h-px bg-mpk-ink transition-transform duration-300 motion-reduce:transition-none",
                  open ? "top-[17.5px] -rotate-45" : "top-[22px]",
                )}
              />
            </button>
          </div>
        </div>

        <div
          id={menuId}
          ref={menuRef}
          hidden={!open}
          className="absolute inset-x-0 top-full border-b border-mpk-line bg-mpk-bg px-4 pt-2 pb-5 @2xl:hidden"
        >
          <nav aria-label={navLabel}>
            <ul className="m-0 list-none p-0">
              {links.map((link, i) => (
                <li key={keyOf(link)}>{renderLink(link, i, true)}</li>
              ))}
            </ul>
          </nav>
          {menuFooter && <div className="mt-4 flex flex-wrap items-center gap-2">{menuFooter}</div>}
        </div>
      </header>
    </MotionConfig>
  );
}
