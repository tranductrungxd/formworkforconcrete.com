import { Check } from "lucide-react";
import { PageHeader } from "@/components/sections/PageHeader";
import { ContactForm } from "@/components/ui/ContactForm";
import { Frame } from "@/components/ui/Frame";
import { contactPage } from "@/content/pages";

export function ContactPage() {
  const c = contactPage;
  return (
    <>
      <PageHeader label={c.label} h1={c.h1} image={c.hero} imageAlt={c.heroAlt} findOutMore={c.findOutMore} />

      {/* The contact form every contact button of the site links to (owner decision 2026-10-04), first on the page since
          the website audit of 2026-10-07. Same presentation as oceanbim.com: the form in a bordered white card on a light band.
          "find out more" in the header points at #content, so the band carries that id too. */}
      <Frame id="contact-form" className="scroll-mt-6 bg-paper">
        <div id="content" className="grid scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-10 px-[30px] py-[70px] md:grid-cols-[1fr_2fr] md:gap-[60px]">
          <div>
            <h2>{c.form.heading}</h2>
            <p className="mt-5 max-w-[360px] text-[16px] leading-[1.45] text-ink">{c.form.intro}</p>
            <ul className="mt-8 max-w-[360px] space-y-3 text-[15px] leading-[1.4] text-ink">
              {c.form.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check aria-hidden="true" size={18} strokeWidth={2} className="mt-px shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-line bg-white p-6 sm:p-9">
            <ContactForm />
          </div>
        </div>
      </Frame>

      <Frame className="grid border-t border-line md:grid-cols-2 md:divide-x md:divide-line">
        {c.branches.map((b) => (
          <div key={b.email} className="px-[30px] pb-[70px] pt-[60px]">
            <h5 className="text-[20px]">
              <a href={b.href} className="text-text">
                {b.name}
              </a>
            </h5>
            <div className="mt-5">
              <a href={`mailto:${b.email}?subject=${encodeURIComponent(c.mailSubject)}`} className="text-[16px] text-ink hover:underline hover:decoration-accent hover:underline-offset-4">
                {b.email}
              </a>
            </div>
          </div>
        ))}
      </Frame>
      <div className="h-[60px]" />
    </>
  );
}
