import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@/components/ui/Analytics";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { LOCALE, SITE_URL } from "@/content/site";
import { manrope } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL) };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-scroll-behavior: globals.css sets `scroll-behavior: smooth` on <html> (for #anchor links). Since Next 16 it
    // must be told to switch smooth scrolling off while changing page, otherwise a new page glides up from the old
    // scroll position instead of starting at the top.
    <html lang={LOCALE} className={manrope.variable} data-scroll-behavior="smooth">
      <head>
        {/* Every photo comes from Cloudinary: open that connection during HTML parsing. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
