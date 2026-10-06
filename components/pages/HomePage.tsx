import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Column, Frame, Label } from "@/components/ui/Frame";
import { HeroVideo } from "@/components/ui/HeroVideo";
import { Img } from "@/components/ui/Img";
import { home } from "@/content/home";
import { CONTACT_FORM_HREF } from "@/content/site";

/** Cell of the hairline grid: 30px padding, vertical lines between cells from md up. */
const grid3 = "grid md:grid-cols-3 md:divide-x md:divide-line";
const cell = "px-[30px] py-[30px]";

/** A paragraph with a bold lead-in, e.g. "**Layouts that don't match your yard** — panels get rented late…". */
function Lead({ lead, text }: { lead: string; text: string }) {
  return (
    <p>
      <strong className="font-bold">{lead}</strong> — {text}
    </p>
  );
}

export function HomePage() {
  const h = home;
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="home-h1">
        <Column className="px-[10px] pb-[60px] pt-[16px]">
          <h1 id="home-h1" className="max-w-[900px]">
            {h.hero.h1}
          </h1>
          <p className="mt-3 text-[16px] leading-[1.4]">{h.hero.lead}</p>
          <p className="mt-4 text-[16px] font-bold">{h.hero.facts}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 md:pl-[30px]">
            <Button href={CONTACT_FORM_HREF}>{h.hero.primary}</Button>
            <Button href={h.hero.secondary.href} variant="link">
              {h.hero.secondary.label}
            </Button>
          </div>
        </Column>
        <HeroVideo id={h.hero.video.id} title={h.hero.video.title} poster={h.hero.video.poster} />
      </section>

      {/* Where formwork goes wrong */}
      <Frame className={grid3}>
        <div className={`${cell} md:py-[130px]`}>
          <h2>{h.problems.heading}</h2>
        </div>
        <div className="hidden md:block" />
        <div className={`${cell} space-y-5 text-[16px] md:py-[130px]`}>
          <p className="font-bold">{h.problems.intro}</p>
          {h.problems.items.map((i) => (
            <Lead key={i.lead} {...i} />
          ))}
          <p className="font-bold">{h.problems.closing}</p>
        </div>
      </Frame>

      {/* Solutions: heading row and the stack of four cards on the orange band */}
      <Frame className={grid3}>
        <div className={`${cell} pb-[30px] pt-[50px]`}>
          <Label>{h.solutions.label}</Label>
          <h2 className="mt-3">{h.solutions.heading}</h2>
        </div>
      </Frame>
      <section className="bg-accent py-[50px] md:py-[100px]" aria-label={h.solutions.heading}>
        <div className="mx-5 flex flex-col gap-[40px] min-[1360px]:mx-auto min-[1360px]:max-w-site lg:gap-[240px]">
          {h.solutions.cards.map((c, i) => (
            <article
              key={c.id}
              id={c.id}
              // Desktop: the cards pin to the top and stack over each other as the page scrolls, like the old site.
              style={{ top: 40 + i * 30, zIndex: i + 1 }}
              className="grid scroll-mt-10 items-center gap-8 bg-white px-[30px] py-[50px] md:grid-cols-2 md:gap-[40px] md:px-[64px] md:py-[60px] lg:sticky lg:min-h-[590px]"
            >
              <div className="max-w-[540px]">
                <h3>{c.title}</h3>
                <div className="mt-5 space-y-4 text-[16px] leading-[1.4]">
                  {c.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
              <div className="relative aspect-[4/3] w-full">
                <Img src={c.image} alt={c.title} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-contain" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Support various types of structures */}
      <Frame className={grid3}>
        <div className={`${cell} md:py-[130px]`}>
          <h2>{h.structures.heading}</h2>
        </div>
        <div className="hidden md:block" />
        <div className={`${cell} space-y-5 text-[16px] md:py-[130px]`}>
          {h.structures.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Frame>
      <Frame className="relative h-[360px] md:h-[585px]">
        <Img src={h.structures.image} alt={h.structures.imageAlt} fill sizes="(min-width: 1360px) 1280px, 100vw" className="object-cover" />
        <div className="absolute right-0 top-0 w-full md:w-1/3">
          <Button href={CONTACT_FORM_HREF} variant="block">
            {h.structures.button}
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-white px-[30px] pb-5 pt-[30px] md:w-1/3">
          <Label>{h.structures.label}</Label>
        </div>
      </Frame>
      <Frame className={`${grid3} pb-[60px]`}>
        {h.structures.columns.map((col, i) => (
          <ul key={i} className={`${cell} space-y-[14px] text-[16px] font-bold uppercase leading-[1.2] md:pt-[40px]`}>
            {col.map((item) => (
              <li key={item}>
                <Link href="/projects/" className="text-text hover:text-ink">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </Frame>

      {/* BIM modeling: scaffolding and shoring */}
      <section className="bg-ink text-white" aria-labelledby="scaffold-h2">
        <Column className="grid items-center gap-[40px] px-[10px] py-[90px] md:grid-cols-[1fr_1fr] md:py-[120px]">
          <div>
            <Label invert>{h.scaffolding.label}</Label>
            <h2 id="scaffold-h2" className="mt-3 max-w-[560px] !text-white">
              {h.scaffolding.heading}
            </h2>
            <div className="mt-8">
              <Button href={CONTACT_FORM_HREF} variant="link" className="!text-white">
                {h.scaffolding.button}
              </Button>
            </div>
            <div className="mt-[50px] max-w-[440px]">
              <Accordion items={h.scaffolding.items} />
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <Img src={h.scaffolding.image} alt="Detailed formwork design drawing with scaffolding support" fill sizes="(min-width: 768px) 560px, 100vw" className="object-contain" />
          </div>
        </Column>
      </section>

      {/* What lands in your inbox */}
      <Frame className={grid3}>
        <div className={`${cell} pb-[40px] pt-[70px]`}>
          <Label>{h.deliverables.label}</Label>
          <h2 className="mt-3 max-w-[320px]">{h.deliverables.heading}</h2>
        </div>
      </Frame>
      <Frame className="grid md:grid-cols-3 md:divide-x md:divide-line">
        {h.deliverables.items.map((d) => (
          <article key={d.title} className="relative px-[10px] pb-[50px] pt-[10px]">
            <div className="relative aspect-[727/582] w-full">
              <Img src={d.image} alt={d.title} fill sizes="(min-width: 768px) 420px, 100vw" className="object-contain" />
            </div>
            <h3 className="mt-3 text-[28px] leading-[1.1]">
              <Link href={d.href} className="after:absolute after:inset-0">
                {d.title}
              </Link>
            </h3>
            <p className="mt-3 text-[16px] leading-[1.4] text-ink">{d.text}</p>
          </article>
        ))}
      </Frame>

      {/* How we work */}
      <Frame className={grid3}>
        <div className={`${cell} md:py-[130px]`}>
          <h2>{h.process.heading}</h2>
        </div>
        <div className="hidden md:block" />
        <div className={`${cell} space-y-5 text-[16px] md:py-[130px]`}>
          {h.process.steps.map((s) => (
            <Lead key={s.lead} {...s} />
          ))}
        </div>
      </Frame>

      {/* Expertise */}
      <Frame className="mt-[50px] grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[664px]">
          <Img src={h.expertise.image} alt={h.expertise.imageAlt} fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-between bg-accent text-white">
          <div className="px-[30px] pb-[40px] pt-[80px] md:px-[102px] md:pt-[120px]">
            <Label invert>{h.expertise.label}</Label>
            <h2 className="mt-3 max-w-[460px] !text-white">{h.expertise.heading}</h2>
            <div className="mt-8 max-w-[400px] space-y-4 text-[16px] leading-[1.4]">
              {h.expertise.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <div className="md:ml-[33.4%]">
            <Button href={CONTACT_FORM_HREF} variant="block">
              {h.expertise.button}
            </Button>
          </div>
        </div>
      </Frame>

      {/* Projects */}
      <Frame className={`${grid3} mt-[50px]`}>
        <div className={`${cell} pt-[50px]`}>
          <Label>{h.projects.label}</Label>
          <h2 className="mt-3">
            <Link href="/projects/">{h.projects.heading}</Link>
          </h2>
        </div>
      </Frame>
      <Frame className={`${grid3} border-t-0`}>
        {h.projects.cards.map((c) => (
          <article key={c.title} className="relative flex flex-col px-[30px] pb-[60px] pt-[40px]">
            <div className="relative aspect-[891/675] w-full">
              <Img src={c.image} alt={c.alt} fill sizes="(min-width: 768px) 400px, 100vw" className="object-contain" />
            </div>
            <h3 className="mt-[40px] text-[20px] leading-[1.2] text-text">
              <Link href={c.href} className="after:absolute after:inset-0">
                {c.title}
              </Link>
            </h3>
            <p className="mt-3 min-h-[66px] text-[16px] leading-[1.4]">{c.text}</p>
            <span aria-hidden="true" className="mt-5 inline-flex w-fit items-center gap-3 border-b-2 border-accent pb-0.5 text-[14px] font-bold uppercase leading-none tracking-[0.14em] text-ink">
              View more
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </article>
        ))}
      </Frame>
      <Column className="px-[10px] pb-[60px] pt-[10px]">
        <Button href="/projects/">{h.projects.more}</Button>
      </Column>

      {/* The systems we design in */}
      <section className="mt-[30px] pb-[60px]" aria-labelledby="systems-h2">
        <div className="mx-auto max-w-[620px] px-5 text-center">
          <h2 id="systems-h2">{h.systems.heading}</h2>
          <p className="mx-auto mt-[60px] max-w-[590px] text-[16px] leading-[1.4]">{h.systems.text}</p>
        </div>
        {/*
          Three columns: items left, the building in the middle, items right. The building is sticky (as on the old site:
          pinned 100px from the top, 90px on tablets) so it travels down with the scroll along the whole section, then
          stops at its end. Below 768px it is a plain image above the items.
        */}
        <div className="relative mx-auto mt-[40px] grid max-w-[1000px] gap-12 px-5 md:grid-cols-[1fr_238px_1fr] md:gap-x-0 lg:grid-cols-[1fr_323px_1fr]">
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 hidden w-px bg-line md:block">
            <span className="absolute bottom-0 left-0 h-6 w-px bg-accent" />
          </div>
          <div className="space-y-[120px] md:pr-4 md:pt-[40px] lg:pr-10">
            {[h.systems.items[0], h.systems.items[2], h.systems.items[4]].map((item) => (
              <SystemItem key={item.text} item={item} />
            ))}
          </div>
          <div className="order-first md:order-none">
            <div className="relative z-10 mx-auto aspect-square w-[260px] md:sticky md:top-[90px] md:mt-[70px] md:w-[238px] lg:top-[100px] lg:w-[323px]">
              <Img src={h.systems.center} alt={h.systems.centerAlt} fill sizes="(min-width: 1024px) 323px, 260px" className="object-contain" />
            </div>
          </div>
          <div className="space-y-[120px] md:pl-4 md:pt-[220px] lg:pl-10">
            {[h.systems.items[1], h.systems.items[3], h.systems.items[5]].map((item) => (
              <SystemItem key={item.text} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Ready */}
      <Column className="px-[10px] pb-[50px] pt-[10px]">
        <h2>{h.ready.heading}</h2>
        <div className="mt-6 space-y-4 text-[16px] leading-[1.4] text-ink">
          {h.ready.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Column>
    </>
  );
}

type SystemItem = (typeof home.systems.items)[number];

function SystemItem({ item }: { item: SystemItem }) {
  if ("logo" in item) {
    return (
      <div className="max-w-[340px]">
        <a href={item.href} target="_blank" rel="noopener" className="block w-[68px]">
          <Img src={item.logo} alt={item.logoAlt} sizes="120px" className="h-auto w-[68px]" />
        </a>
        <p className="mt-5 text-[14px] leading-[1.4]">{item.text}</p>
      </div>
    );
  }
  return (
    <div className="max-w-[340px]">
      <h3 className="text-[28px] leading-[1.1]">{item.title}</h3>
      <p className="mt-5 text-[14px] leading-[1.4]">{item.text}</p>
    </div>
  );
}
