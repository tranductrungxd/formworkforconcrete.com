import { ExpertiseBand } from "@/components/sections/ExpertiseBand";
import { QuoteCta } from "@/components/sections/QuoteCta";
import { Button } from "@/components/ui/Button";
import { Column, Frame, Label } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { Markdown } from "@/components/ui/Markdown";
import { projectTemplate } from "@/content/pages";
import { getOtherProjects, type Project } from "@/lib/content";

type Block = { kind: "heading"; text: string } | { kind: "text"; md: string } | { kind: "gallery"; images: { alt: string; src: string }[] };

/**
 * Splits the Markdown body of a project into headings, copy and image galleries (consecutive images form one
 * two-column gallery), so the layout follows the old page without any layout markup in the content files.
 */
function toBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean)) {
    const img = chunk.match(/^!\[([^\]]*)\]\((\S+)\)$/);
    const heading = chunk.match(/^#{1,6}\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (img) {
      if (last?.kind === "gallery") last.images.push({ alt: img[1], src: img[2] });
      else blocks.push({ kind: "gallery", images: [{ alt: img[1], src: img[2] }] });
    } else if (heading) blocks.push({ kind: "heading", text: heading[1] });
    else if (last?.kind === "text") last.md += `\n\n${chunk}`;
    else blocks.push({ kind: "text", md: chunk });
  }
  return blocks;
}

/** One line of excerpt text per <br>; the newlines inside the WordPress excerpt are only source formatting. */
function excerptLines(excerpt: string): string[] {
  return excerpt
    .split(/<br\s*\/?>/i)
    .map((l) => l.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export function ProjectPage({ project }: { project: Project }) {
  const blocks = toBlocks(project.body);
  // The first heading ("Concrete forming design service") sits in a hairline cell, the later ones are plain headings.
  const firstHeading = blocks.findIndex((b) => b.kind === "heading");
  return (
    <>
      <Frame className="grid md:grid-cols-3 md:divide-x md:divide-line">
        <div className="px-[30px] pb-[40px] pt-[40px] md:col-span-2">
          <Label>{projectTemplate.label}</Label>
          <h1 className="mt-3 max-w-[560px] !text-[36px] !leading-[1.2] max-md:!text-[25px]">{project.title}</h1>
        </div>
      </Frame>

      <Frame className="grid bg-paper md:grid-cols-[2fr_1fr]">
        <div className="flex items-center px-[30px] py-[60px] md:py-[90px]">
          <div className="max-w-[600px] text-[20px] font-bold uppercase leading-[1.2] text-ink">
            {excerptLines(project.excerpt).map((l) => (
              <p key={l} className="[&+p]:mt-2">
                {l}
              </p>
            ))}
          </div>
        </div>
        <div className="relative mx-[30px] mb-[30px] aspect-[4/3] bg-white md:mx-0 md:mb-0 md:mr-[30px] md:aspect-auto md:min-h-[280px] md:self-stretch">
          <Img src={project.cover} alt={project.coverAlt} fill priority sizes="(min-width: 768px) 420px, 100vw" className="object-contain" />
        </div>
      </Frame>

      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          if (i === firstHeading) {
            return (
              <Frame key={i} className="grid border-t border-line md:grid-cols-3 md:divide-x md:divide-line">
                <div className="px-[30px] py-[90px] md:py-[110px]">
                  <h2 className="max-w-[400px]">{b.text}</h2>
                </div>
                <div className="hidden md:block" />
                <div className="hidden md:block" />
              </Frame>
            );
          }
          return (
            <Column key={i} className="px-[10px] pt-[40px]">
              <h2>{b.text}</h2>
            </Column>
          );
        }
        if (b.kind === "gallery") {
          return (
            <Frame key={i} className="grid gap-px bg-line md:grid-cols-2">
              {b.images.map((img) => (
                <div key={img.src} className="relative aspect-[842/595] bg-white">
                  <Img src={img.src} alt={img.alt} fill sizes="(min-width: 1360px) 640px, (min-width: 768px) 50vw, 100vw" className="object-contain" />
                </div>
              ))}
            </Frame>
          );
        }
        return (
          <Column key={i} className="px-[10px] pt-[20px]">
            <Markdown className="max-w-none text-ink">{b.md}</Markdown>
          </Column>
        );
      })}

      {(project.tags.length > 0 || project.moreProjects) && (
        <Column className="px-[10px] pb-[40px] pt-[20px]">
          {project.tags.length > 0 && <p className="flex flex-wrap gap-x-4 text-[16px] text-ink">{project.tags.map((t) => <span key={t}>{t}</span>)}</p>}
          {project.moreProjects && (
            <div className="mt-6">
              <Button href="/projects/">{projectTemplate.moreProjects}</Button>
            </div>
          )}
        </Column>
      )}

      <div className="mt-[60px]">
        <ExpertiseBand />
      </div>
      <QuoteCta projects={getOtherProjects(project.slug)} />
    </>
  );
}
