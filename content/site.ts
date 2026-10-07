import type { MediaUrl } from "./media.generated";

export const SITE_URL = "https://formworkforconcrete.com";
export const SITE_NAME = "Formwork for concrete";
export const LOCALE = "en-US";

export const company = {
  name: "Formwork for Concrete",
  email: "contact@formworkforconcrete.com",
  parentName: "oceanBIM",
  parentUrl: "https://oceanbim.com/",
  parentEmail: "contact@oceanbim.com",
} as const;

/** GA4 property of the old site; kept so reporting continues without a break. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-YR5V883PZR";

/** Every contact call-to-action goes here (owner decision 2026-10-04). */
export const CONTACT_FORM_HREF = "/contact-us/#contact-form";

export const logo: MediaUrl = "https://formworkforconcrete.com/wp-content/uploads/2024/04/FormworkForConcrete-e1726569806563.png";

export interface MegaMenu {
  title: string;
  viewAll: { label: string; href: string };
  items: { label: string; href: string }[];
  image: MediaUrl;
  imageAlt: string;
}

export const nav: { label: string; href: string; mega?: MegaMenu }[] = [
  { label: "Home", href: "/" },
  {
    label: "Solutions",
    href: "/#production-formwork-layout",
    mega: {
      title: "What We Provide",
      viewAll: { label: "View all", href: "/#production-formwork-layout" },
      items: [
        { label: "Production Formwork Layouts Drawing", href: "/#production-formwork-layout" },
        { label: "Bill of Quantities And Detailed Schedule", href: "/#bill-of-qualities-and-detailed-schedule" },
        { label: "Concrete Pourmap Phasing", href: "/#concrete-pourmap-phasing" },
        { label: "Modular systems design", href: "/#modular-systems-design" },
      ],
      image: "https://formworkforconcrete.com/wp-content/uploads/2024/09/formwork-for-concrete-planning-min-scaled.webp",
      imageAlt: "Engineers reviewing formwork drawings under a timber slab formwork",
    },
  },
  {
    label: "Projects",
    href: "/projects/",
    mega: {
      title: "Categories of Projects We've Finished",
      viewAll: { label: "View all", href: "/projects/" },
      items: [
        { label: "Manufacturing", href: "/projects/" },
        { label: "Residential", href: "/projects/" },
        { label: "Dam renovation", href: "/projects/" },
        { label: "Infrastructure", href: "/projects/" },
        { label: "Elevator cores walls", href: "/projects/" },
      ],
      image: "https://formworkforconcrete.com/wp-content/uploads/2024/09/concrete-formwork-structure_ko6gyp-jpg-e1726481630110.webp",
      imageAlt: "Concrete formwork structure",
    },
  },
  { label: "Contact Us", href: "/contact-us/" },
  { label: "News", href: "/news/" },
];

/** The mobile menu (menu 109 of the old site) has no "Solutions" entry. */
export const mobileNav = nav.filter((n) => n.label !== "Solutions");

export const sidePanel = {
  label: "Contact us",
  lines: ["Formwork", "for concrete"],
  memberOf: "As a member of oceanBIM company",
  cta: { label: "Get in touch", href: CONTACT_FORM_HREF },
} as const;

export const footer = {
  heading: "We would be happy to make you an offer at short notice.",
  about: "Formwork for concrete is a part of the oceanBIM company, specializing in the design and production of drawings for diverse concrete formwork solutions.",
  aboutLink: { label: "oceanBIM", href: "https://oceanbim.com/" },
  moreAboutUs: { title: "More about us", links: [{ label: "Contact Us", href: "/contact-us/" }, { label: "Projects", href: "/projects/" }] },
  company: {
    title: "Company",
    memberOf: ["As a member of ", "oceanBIM", " company"],
    links: [
      { label: "Formwork and Rebar Drawings", href: "https://oceanbim.com/formwork-and-rebar-drawing/" },
    ],
  },
  copyright: "Formwork for concrete",
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/formwork-for-concrete/" },
    { label: "YouTube", href: "https://www.youtube.com/watch?v=wSmxcxbb0yg" },
    { label: "Facebook", href: "https://www.facebook.com/oceanbim" },
  ],
} as const;
