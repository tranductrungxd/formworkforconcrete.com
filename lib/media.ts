import { mediaAssets, type MediaAsset } from "@/content/media.generated";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "oceanbim";
const registry: Record<string, MediaAsset> = mediaAssets;

/** The Cloudinary asset for an old WordPress / Cloudinary URL. Throws, so a missing image fails the build. */
export function media(url: string): MediaAsset {
  const asset = registry[url.replace(/^http:\/\/formworkforconcrete\.com/, "https://formworkforconcrete.com")];
  if (!asset) throw new Error(`Image not in content/media-manifest.csv: ${url} (run pnpm media:scan && pnpm media:upload)`);
  return asset;
}

/** Absolute Cloudinary delivery URL (for plain <img> and for places next/image cannot reach). */
export function cdnUrl(url: string, transform?: string): string {
  const a = media(url);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${transform ? `${transform}/` : ""}${encodeURI(a.id)}`;
}
