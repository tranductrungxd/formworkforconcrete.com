import { PostCard } from "@/components/sections/PostCard";
import { Frame } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { Markdown } from "@/components/ui/Markdown";
import { postTemplate } from "@/content/pages";
import { formatDate, getPosts, type Post } from "@/lib/content";

export function PostPage({ post }: { post: Post }) {
  const related = getPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);
  return (
    <>
      <Frame className="px-[20px] pb-[70px] pt-[70px] md:px-0">
        <article className="mx-auto max-w-[830px]">
          <p className="text-center text-[16px] text-ink">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true" className="mx-2">•</span>
            {post.category}
          </p>
          <h1 className="mt-3 text-center text-[32px] leading-[1.1] md:text-[32px]">{post.title}</h1>
          <div className="relative mt-[40px] aspect-[830/415] w-full overflow-hidden">
            <Img src={post.cover} alt={post.coverAlt} fill priority sizes="(min-width: 1024px) 830px, 100vw" className="object-cover" />
          </div>
          <Markdown className="mt-[40px]">{post.body}</Markdown>
          {post.tags.length > 0 && <p className="mt-[60px] text-[13px] leading-[1.2] text-muted">{post.tags.join(", ")}</p>}
        </article>
      </Frame>

      <Frame className="border-t border-line">
        <h2 className="px-[30px] pb-[10px] pt-[60px] text-[24px]">{postTemplate.relatedHeading}</h2>
        <div className="grid md:grid-cols-3 md:divide-x md:divide-line">
          {related.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </Frame>
    </>
  );
}
