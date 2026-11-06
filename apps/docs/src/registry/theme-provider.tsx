"use client";

import { ThemeProvider, type ThemeProviderProps } from "next-themes";

/**
 * next-themes with the mpkcn defaults: a `dark` / `light` class on <html>, dark first,
 * and no transition flash when the theme switches. Any prop you pass overrides a default.
 * `npx mpkcn add theme-toggle` wraps your root layout in it.
 */
export function MpkcnThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </ThemeProvider>
  );
}
