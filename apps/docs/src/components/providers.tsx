"use client";

import type { ReactNode } from "react";
import { MpkcnThemeProvider } from "@/registry/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return <MpkcnThemeProvider>{children}</MpkcnThemeProvider>;
}
