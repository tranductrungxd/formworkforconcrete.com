import Image from "next/image";
import { media } from "@/lib/media";

/**
 * An image from the Cloudinary registry (content/media.generated.ts), addressed by the URL the copy still uses.
 * Goes through next/image with the Cloudinary loader. `fill` makes it cover its (relatively positioned) parent.
 */
export function Img({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  fill = false,
  className = "",
}: {
  src: string;
  /** Overrides the alt text recorded in the manifest. Pass "" for a purely decorative image. */
  alt?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  className?: string;
}) {
  const a = media(src);
  const text = alt ?? a.alt ?? "";
  // Above-the-fold images: eager + high fetch priority.
  const hints = priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {};
  return fill ? (
    <Image src={a.id} alt={text} sizes={sizes} className={className} fill {...hints} />
  ) : (
    <Image src={a.id} alt={text} sizes={sizes} className={className} width={a.w} height={a.h} {...hints} />
  );
}
