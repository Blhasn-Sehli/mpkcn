import type { Metadata, Viewport } from "next";
import type React from "react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/docs";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`${siteConfig.url}/`),
  title: {
    default: "mpkcn — Terminal-style React components",
    template: "%s — mpkcn",
  },
  description: siteConfig.description,
  applicationName: "mpkcn",
  authors: [{ name: "MpK", url: siteConfig.github }],
  keywords: ["react", "nextjs", "tailwind", "components", "terminal", "shadcn", "ui kit"],
  openGraph: {
    type: "website",
    siteName: "mpkcn",
    title: "mpkcn — Terminal-style React components",
    description: siteConfig.description,
    url: "./",
  },
  twitter: {
    card: "summary",
    title: "mpkcn — Terminal-style React components",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0d10" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}>
      <body className="flex min-h-dvh flex-col bg-mpk-bg font-mpk-sans text-mpk-ink antialiased">
        <Providers>
          <a
            href="#content"
            className="sr-only z-[100] border border-mpk-line bg-mpk-bg px-3 py-2 font-mpk-mono text-xs focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            skip to content
          </a>
          <SiteHeader />
          <div id="content" className="flex flex-1 flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
