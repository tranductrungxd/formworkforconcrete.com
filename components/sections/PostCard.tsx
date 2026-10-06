import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Img } from "@/components/ui/Img";
import type { Post } from "@/lib/content";

/** A news card: photo with the white arrow tab, category and title. The whole card is one link. */
export function PostCard({ post, sizes = "(min-width: 768px) 365px, 100vw" }: { post: Post; sizes?: string }) {
  return (
    <article className="relative flex flex-col px-[30px] py-[30px]">
      <div className="relative aspect-[365/243] w-full overflow-hidden bg-white">
        <Img src={post.cover} alt={post.coverAlt} fill sizes={sizes} className="object-cover" />
        <span aria-hidden="true" className="absolute bottom-0 left-0 flex h-[64px] w-[93px] items-center justify-center bg-white text-accent">
          <ArrowRight size={18} strokeWidth={1.5} />
        </span>
      </div>
      <p className="mt-[30px] text-[14px] text-ink">{post.category}</p>
      <h3 className="mt-3 text-[18px] leading-[1.15] text-ink">
        <Link href={`/${post.slug}/`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
    </article>
  );
}
