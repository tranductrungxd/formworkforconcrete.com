// Copy of the inner pages (contact, projects, news) and of the shared project / post templates, verbatim from WordPress.
import type { MediaUrl } from "./media.generated";

const wp = (path: string) => `https://formworkforconcrete.com/wp-content/uploads/${path}` as MediaUrl;

export const contactPage = {
  label: "Contact Us",
  h1: "Reach Out for a Free Consultation and Quote",
  findOutMore: "find out more",
  hero: wp("2024/10/house-or-villa-under-construction-using-modern-tec-min-scaled.webp"),
  heroAlt: "House under construction using modern formwork techniques",
  branches: [
    { name: "formwork for concrete", href: "https://formworkforconcrete.com/", email: "contact@formworkforconcrete.com" },
    { name: "oceanbim main BRANCH", href: "https://oceanbim.com/", email: "contact@oceanbim.com" },
  ],
  mailSubject: "Contact for Formwork Service",
  // New section (owner decision 2026-10-04: a contact form on this page, every contact button links to it).
  form: {
    heading: "Send Your Drawings",
    intro: "Send us your structural set and tell us what you’re building with, and we’ll come back with a scope, a price and a delivery date.",
  },
} as const;

export const projectsPage = {
  label: "Projects",
  h1: "Our Works",
  findOutMore: "find out more",
  hero: wp("2024/10/high-rise-building-under-construction-min-scaled.webp"),
  heroAlt: "Concrete formwork design service",
  introHeading: "We deliver a full range of formwork design services",
  intro: [
    "At our company, we specialize in providing expert concrete formwork design services for a wide range of structures.",
    "From foundations and walls to slabs and complex geometries, we ensure precision and efficiency in every project.",
    "Our services include detailed drawings, 3D modeling, and comprehensive cost estimation.",
    "With a commitment to quality and innovation, we deliver formwork solutions that meet the specific needs of your construction project",
  ],
  body: `Each project begins with detailed planning, followed by precise engineering of formwork systems using materials such as PERI and Doka. Safety, durability, and efficiency guide our workflow.

Our team specializes in delivering safe, efficient, and customized **concrete formwork solutions** for a wide range of infrastructure projects.

Below, you’ll find a selection of our completed works, including outlet spillways, dams, and structural walls.

From large-scale civil projects to commercial foundations, we adapt our approach to meet engineering requirements and site conditions

Looking for an experienced formwork partner? [Contact us](/contact-us/#contact-form) to discuss your next project.`,
  ctaHeading: "Great Projects Begin with GOOD Formwork",
  ctaButton: "Contact us",
  ctaImage: wp("2024/09/construction-worker-leveling-wet-cement-into-wood-min-scaled.webp"),
  ctaImageAlt: "Worker levelling wet concrete against a timber form",
  closing: `Our concrete formwork projects span a wide range of civil infrastructure applications, including **spillways**, **dams**, **retaining walls**, and **foundations**.

We apply best practices aligned with the standards of the [American Concrete Institute (ACI)](https://www.concrete.org/) and draw inspiration from industry leaders like [PERI Formwork Systems](https://www.peri.com/) and [Doka](https://www.doka.com/).

Each project is designed to meet the unique structural and environmental challenges of the site, ensuring both safety and durability.`,
} as const;

export const newsPage = {
  h1: "Formwork Design News & Insights",
} as const;

/** Shared parts of every project page (Elementor template 9579). */
export const projectTemplate = {
  label: "Projects",
  expertise: {
    heading: "EXPERTISE",
    paragraphs: [
      "We specialize in design and formwork modeling services, utilizing BIM technology to provide precise material estimates and scheduling.",
      "We have successfully completed numerous challenging and complex projects, ensuring optimal efficiency, safety, and cost-effectiveness.",
    ],
    image: wp("2024/10/construction-of-the-stadium-aerial-view-min-scaled.webp"),
    imageAlt: "Aerial view of a stadium under construction",
  },
  cta: {
    label: "Become a Customer",
    heading: "CONTACT US FOR FREE QUOTATION",
    text: "Contact us for a free consultation, customized to meet the specific needs of your project",
    button: "Contact us",
    // The old template points at /2023/09/pexels-laura-tancredi-7078502.jpg, which does not exist on the server
    // either, so the right half of this band is empty on the live site. Left empty here too until the owner picks a photo.
  },
  moreProjects: "More projects",
} as const;

/** Shared parts of every post page (Elementor template 9209). */
export const postTemplate = {
  relatedHeading: "Related news",
} as const;
