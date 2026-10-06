import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/sections/PostCard";
import { Column, Frame } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { newsPage } from "@/content/pages";
import { getPosts } from "@/lib/content";

export function NewsPage() {
  const [latest, ...rest] = getPosts();
  return (
    <>
      <Column className="px-[0px] pb-[40px] pt-[90px]">
        <h1>{newsPage.h1}</h1>
      </Column>

      {/* The newest post is featured */}
      <Column>
        <article className="relative grid bg-paper md:grid-cols-2">
          <div className="flex flex-col justify-center px-[30px] py-[60px]">
            <p className="text-[14px] text-ink">{latest.category}</p>
            <h2 className="mt-4 max-w-[460px] text-[28px] leading-[1.1] text-ink">
              <Link href={`/${latest.slug}/`} className="after:absolute after:inset-0">
                {latest.title}
              </Link>
            </h2>
          </div>
          <div className="px-[30px] pb-[30px] md:py-[90px] md:pl-0 md:pr-[30px]">
            <div className="relative aspect-[610/407] w-full overflow-hidden">
              <Img src={latest.cover} alt={latest.coverAlt} fill priority sizes="(min-width: 768px) 610px, 100vw" className="object-cover" />
              <span aria-hidden="true" className="absolute bottom-0 left-0 flex h-[64px] w-[93px] items-center justify-center bg-white text-accent">
                <ArrowRight size={18} strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </article>
      </Column>

      <Frame className="grid md:grid-cols-3 md:[&>article]:border-b md:[&>article]:border-line md:[&>article:not(:nth-child(3n))]:border-r md:[&>article:not(:nth-child(3n))]:border-line">
        {rest.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </Frame>
      <div className="h-[60px]" />
    </>
  );
}
