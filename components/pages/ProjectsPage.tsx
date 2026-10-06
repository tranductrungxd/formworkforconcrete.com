import Link from "next/link";
import { PageHeader } from "@/components/sections/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, Frame } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { Markdown } from "@/components/ui/Markdown";
import { projectsPage as p } from "@/content/pages";
import { CONTACT_FORM_HREF } from "@/content/site";
import { getProjects } from "@/lib/content";

export function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHeader label={p.label} h1={p.h1} image={p.hero} imageAlt={p.heroAlt} findOutMore={p.findOutMore} />
      <Frame id="content" className="grid scroll-mt-6 md:grid-cols-3 md:divide-x md:divide-line">
        <div className="px-[30px] py-[60px]">
          <p className="max-w-[300px] text-[20px] font-bold uppercase leading-[1.2] text-ink">{p.introHeading}</p>
        </div>
        <div className="space-y-5 px-[30px] py-[60px] text-[16px] leading-[1.4]">
          {p.intro.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </Frame>

      <Frame className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article key={project.slug} className="relative flex min-h-[150px] items-center justify-between gap-2 border-b border-line pl-[30px] sm:[&:nth-child(odd)]:border-r lg:[&:nth-child(odd)]:border-r-0 lg:[&:not(:nth-child(3n))]:border-r">
            <h3 className="max-w-[180px] text-[16px] leading-[1.2] text-ink">
              <Link href={`/projects/${project.slug}/`} className="after:absolute after:inset-0">
                {project.title}
              </Link>
            </h3>
            <div className="relative h-[150px] w-[180px] shrink-0">
              <Img src={project.cover} alt={project.coverAlt} fill sizes="180px" className="object-cover" />
            </div>
          </article>
        ))}
      </Frame>

      <Column className="px-[10px] pt-[60px]">
        <Markdown className="max-w-none text-ink">{p.body}</Markdown>
      </Column>

      <Frame className="mt-[50px]">
        <h2 className="px-[30px] py-[50px] text-center">{p.ctaHeading}</h2>
        <div className="relative h-[360px] w-full md:h-[585px]">
          <Img src={p.ctaImage} alt={p.ctaImageAlt} fill sizes="(min-width: 1360px) 1280px, 100vw" className="object-cover" />
          <div className="absolute right-0 top-0 w-full md:w-1/3">
            <Button href={CONTACT_FORM_HREF} variant="block">
              {p.ctaButton}
            </Button>
          </div>
        </div>
      </Frame>
      <Column className="px-[10px] pb-[70px] pt-[10px]">
        <Markdown className="max-w-none text-ink">{p.closing}</Markdown>
      </Column>
    </>
  );
}
