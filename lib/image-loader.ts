// Custom next/image loader for the static export.
//
//  - Cloudinary public id ("formworkforconcrete.com/projects/x"): built into a res.cloudinary.com URL with
//    f_auto,q_auto,c_limit,w_<width>.
//  - Full Cloudinary URL: the transformation is inserted after /upload/.
//  - Any other absolute URL or a "/local" path: returned unchanged.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "oceanbim";

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const t = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  if (src.startsWith("/")) return src;
  if (/^https?:\/\//.test(src)) {
    return src.includes("res.cloudinary.com") && src.includes("/upload/") ? src.replace("/upload/", `/upload/${t}/`) : src;
  }
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}/${encodeURI(src)}`;
}
