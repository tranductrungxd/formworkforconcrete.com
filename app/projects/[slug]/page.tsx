import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/pages/ProjectPage";
import { JsonLd } from "@/components/ui/JsonLd";
import { getProject, getProjects } from "@/lib/content";
import { pageJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

// Only the project pages that exist; anything else is the 404 page (static export).
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return pageMetadata(`/projects/${slug}/`);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <>
      <JsonLd data={pageJsonLd(`/projects/${slug}/`)} />
      <ProjectPage project={project} />
    </>
  );
}
