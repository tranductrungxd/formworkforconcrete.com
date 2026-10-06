import { Manrope } from "next/font/google";

// Manrope is the site font everywhere (body 400, headings and buttons 700). Self-hosted at build time.
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});
