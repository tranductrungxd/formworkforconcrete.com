import type { Metadata } from "next";
import { seo } from "@/content/seo";
import { LOCALE, SITE_NAME } from "@/content/site";

// The value Yoast emits today. Next's `robots` field would reorder the tokens, so it is written as a raw meta tag.
const ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/** Metadata of a page, taken verbatim from the SEO baseline (content/seo.ts). `path` has a leading and a trailing slash. */
export function pageMetadata(path: string): Metadata {
  const e = seo[path];
  if (!e) throw new Error(`No SEO baseline for ${path}`);
  // Same size hints as the old site's og:image:width / og:image:height when the page image is the og image.
  const images = e.ogImage ? [{ url: e.ogImage, ...(e.image?.url === e.ogImage ? { width: e.image.width, height: e.image.height } : {}) }] : undefined;
  return {
    title: { absolute: e.title },
    description: e.description || undefined,
    alternates: { canonical: e.canonical },
    other: { robots: ROBOTS },
    openGraph: {
      type: e.kind === "post" ? "article" : "website",
      siteName: SITE_NAME,
      locale: LOCALE.replace("-", "_"),
      title: e.ogTitle,
      description: e.ogDescription || undefined,
      url: e.canonical,
      images,
      ...(e.kind === "post" ? { publishedTime: e.published, modifiedTime: e.modified } : {}),
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: e.ogTitle, description: e.ogDescription || undefined, images: images?.map((i) => i.url) },
  };
}
