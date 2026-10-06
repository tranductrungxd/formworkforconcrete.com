import type { MetadataRoute } from "next";
import { seo } from "@/content/seo";
import { SITE_URL } from "@/content/site";

export const dynamic = "force-static";

/** Exactly the kept URLs of the baseline (the category and author archives redirect to /news/ and are not listed). */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(seo).map(([path, e]) => ({ url: SITE_URL + path, lastModified: e.modified || undefined }));
}
