import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { company, footer } from "@/content/site";
import { contactPage } from "@/content/pages";
import { EnvelopeIcon, FacebookIcon, LinkedInIcon, YouTubeIcon } from "./Icons";

const mailto = `mailto:${company.email}?subject=${encodeURIComponent(contactPage.mailSubject)}`;
const socialIcons = { LinkedIn: LinkedInIcon, YouTube: YouTubeIcon, Facebook: FacebookIcon } as const;
const arrowLink = "inline-flex items-center gap-3 border-b-2 border-accent pb-0.5 text-[14px] font-bold uppercase leading-none tracking-[0.14em] text-white";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-site px-5 pb-[70px] pt-[90px] min-[1360px]:px-0">
        <h2 className="max-w-[640px] !text-white">{footer.heading}</h2>

        <div className="mt-[60px] grid grid-cols-[minmax(0,1fr)] border-y border-l border-white/40 md:grid-cols-2">
          <div className="border-r border-white/40 px-[30px] py-[60px] md:px-[60px]">
            <p className="max-w-[520px] text-[16px] font-bold uppercase leading-[1.35] text-white">{footer.about}</p>
            <div className="mt-6">
              <a href={footer.aboutLink.href} className={arrowLink} target="_blank" rel="noopener">
                {footer.aboutLink.label}
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
              </a>
            </div>
          </div>
          <div className="flex items-center border-t border-white/40 px-[30px] py-[40px] md:border-t-0 md:px-[10px]">
            <a href={mailto} className="inline-flex items-center gap-3 text-[16px] font-bold uppercase text-white [overflow-wrap:anywhere]">
              <EnvelopeIcon className="shrink-0" />
              {company.email}
            </a>
          </div>
        </div>

        <div className="mt-[60px] grid gap-12 md:grid-cols-2 md:gap-x-[15px]">
          <div>
            <h3 className="!text-[24px] !leading-[1.2] !text-white">{footer.moreAboutUs.title}</h3>
            <ul className="mt-6 space-y-3 text-[14px]">
              {footer.moreAboutUs.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="!text-[24px] !leading-[1.2] !text-white">{footer.company.title}</h3>
            <p className="mt-6 text-[14px]">
              <strong className="font-bold">{footer.company.memberOf[0]}</strong>
              {footer.company.memberOf[1]}
              <strong className="font-bold">{footer.company.memberOf[2]}</strong>
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-white/85">
              {footer.company.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener" className="hover:text-accent">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/25">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-4 px-5 py-8 min-[1360px]:px-0">
          <p className="text-[14px]">
            <strong className="font-bold">© {new Date().getFullYear()}</strong> &nbsp;{footer.copyright}
          </p>
          <ul className="flex items-center gap-10 pr-8">
            {footer.social.map((s) => {
              const Icon = socialIcons[s.label as keyof typeof socialIcons];
              return (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener" aria-label={s.label} className="text-white hover:text-accent">
                    <Icon />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </footer>
  );
}
