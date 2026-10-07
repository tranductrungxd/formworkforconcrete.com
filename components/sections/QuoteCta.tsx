import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Frame, Label } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { CONTACT_FORM_HREF } from "@/content/site";
import { projectTemplate } from "@/content/pages";
import type { Project } from "@/lib/content";

/**
 * "Become a Customer / Have a Similar Project?" at the end of every project and post page. The right half lists
 * similar projects (it was an empty photo slot on the old site, whose image is missing on the server).
 */
export function QuoteCta({ projects = [] }: { projects?: Project[] }) {
  const { cta } = projectTemplate;
  return (
    <Frame className="grid border-t border-line md:grid-cols-2 md:divide-x md:divide-line">
      <div className="px-[30px] py-[90px] md:px-[95px] md:py-[120px]">
        <Label>{cta.label}</Label>
        <h2 className="mt-4 max-w-[430px]">{cta.heading}</h2>
        <p className="mt-6 max-w-[440px] text-[16px] leading-[1.45] text-ink">{cta.text}</p>
        <div className="mt-8">
          <Button href={CONTACT_FORM_HREF}>{cta.button}</Button>
        </div>
      </div>
      {projects.length > 0 ? (
        <div className="border-t border-line px-[30px] py-[60px] md:border-t-0 md:py-[120px]">
          <Label>{cta.related}</Label>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {projects.map((p) => (
              <li key={p.slug} className="relative flex items-center justify-between gap-4 py-4">
                <h3 className="text-[16px] leading-[1.2] text-ink">
                  <Link href={`/projects/${p.slug}/`} className="after:absolute after:inset-0 hover:underline hover:decoration-accent hover:underline-offset-4">
                    {p.title}
                  </Link>
                </h3>
                <div className="relative h-[72px] w-[96px] shrink-0">
                  <Img src={p.cover} alt={p.coverAlt} fill sizes="96px" className="object-cover" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="hidden md:block" />
      )}
    </Frame>
  );
}
