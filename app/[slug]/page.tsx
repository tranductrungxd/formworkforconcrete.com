import { notFound } from "next/navigation";
import { PostPage } from "@/components/pages/PostPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { getPost, getPosts } from "@/lib/content";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

// Blog posts live at the root of the site (/<post-slug>/), as on WordPress. Anything else is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return pageMetadata(`/${slug}/`);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={pageJsonLd(`/${slug}/`)} />
      <PostPage post={post} />
    </>
  );
}
