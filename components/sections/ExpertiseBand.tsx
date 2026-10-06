import { Column } from "@/components/ui/Frame";
import { Img } from "@/components/ui/Img";
import { projectTemplate } from "@/content/pages";

/**
 * Dark "EXPERTISE" band with the aerial photo below it (shared by every project page). The photo sits half on the dark
 * band and half on the white page, as on the old site.
 */
export function ExpertiseBand() {
  const { expertise } = projectTemplate;
  return (
    <section aria-labelledby="expertise-h2">
      <div className="bg-ink pt-[90px] text-white">
        <Column className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-[60px]">
          <h2 id="expertise-h2" className="!text-white">
            {expertise.heading}
          </h2>
          <div className="space-y-5 text-[16px] leading-[1.45] text-white/90">
            {expertise.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Column>
      </div>
      <div className="relative mt-[-1px] pt-[70px]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[calc(70px+60%)] bg-ink md:h-[calc(70px+350px)]" />
        <div className="relative mx-5 min-[1360px]:mx-auto min-[1360px]:max-w-site">
          <div className="relative aspect-[1280/585] w-full">
            <Img src={expertise.image} alt={expertise.imageAlt} fill sizes="(min-width: 1360px) 1280px, 100vw" className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
