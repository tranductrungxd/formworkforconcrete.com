import { seo, type SeoEntry } from "@/content/seo";
import { company, LOCALE, SITE_NAME, SITE_URL } from "@/content/site";

const abs = (path: string) => SITE_URL + path;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO = {
  url: `${SITE_URL}/wp-content/uploads/2024/04/FormworkForConcrete-e1726569806563.png`,
  width: 475,
  height: 52,
};

/** The custom ProfessionalService block the old site adds to every page (WPCode header script). */
export const professionalService = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: company.name,
  url: `${SITE_URL}/`,
  description: "Expert formwork design services for concrete structures including shop drawings, 3D BIM models, BOQ, and concrete pour sequencing plans.",
  email: company.email,
  areaServed: "Worldwide",
  serviceType: "Formwork Design",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Formwork Design Services",
    itemListElement: [
      "Production Formwork Layout Drawings",
      "Scaffolding Shop Drawings",
      "3D Formwork BIM Model",
      "Bills of Quantities (BOQ) for Formwork",
      "Concrete Pour Maps and Sequencing Plans",
    ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
  },
  sameAs: [`${SITE_URL}/`],
};

/**
 * The JSON-LD blocks of one page: the Yoast-style graph (WebPage, ImageObject, BreadcrumbList, WebSite, Organization,
 * plus Article and Person on posts) and the ProfessionalService block. Same @types as the baseline.
 * Two deliberate differences: the WebSite has no SearchAction (the new site has no search), and the post author is the
 * organisation's name instead of the WordPress username, because the author archive is not rebuilt (it redirects to /news/).
 */
export function pageJsonLd(path: string) {
  const e: SeoEntry = seo[path];
  const url = abs(path);
  const imageId = `${url}#primaryimage`;
  const person = `${SITE_URL}/#/schema/person/author`;

  const graph: Record<string, unknown>[] = [];
  if (e.article) {
    graph.push({
      "@type": "Article",
      "@id": `${url}#article`,
      isPartOf: { "@id": url },
      author: { name: SITE_NAME, "@id": person },
      headline: e.h1,
      datePublished: e.published,
      dateModified: e.modified,
      mainEntityOfPage: { "@id": url },
      wordCount: e.article.wordCount,
      publisher: { "@id": ORG_ID },
      ...(e.image ? { image: { "@id": imageId }, thumbnailUrl: e.image.url } : {}),
      keywords: e.article.keywords,
      articleSection: e.article.section,
      inLanguage: LOCALE,
    });
  }
  graph.push({
    "@type": "WebPage",
    "@id": url,
    url,
    name: e.title,
    isPartOf: { "@id": WEBSITE_ID },
    ...(e.kind === "home" ? { about: { "@id": ORG_ID } } : {}),
    ...(e.image ? { primaryImageOfPage: { "@id": imageId }, image: { "@id": imageId }, thumbnailUrl: e.image.url } : {}),
    datePublished: e.published,
    dateModified: e.modified,
    description: e.description,
    breadcrumb: { "@id": `${url}#breadcrumb` },
    inLanguage: LOCALE,
    potentialAction: [{ "@type": "ReadAction", target: [url] }],
  });
  if (e.image) {
    graph.push({ "@type": "ImageObject", inLanguage: LOCALE, "@id": imageId, url: e.image.url, contentUrl: e.image.url, width: e.image.width, height: e.image.height, caption: e.image.caption });
  }
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: e.breadcrumb.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, ...(b.path ? { item: abs(b.path) } : {}) })),
  });
  graph.push({ "@type": "WebSite", "@id": WEBSITE_ID, url: `${SITE_URL}/`, name: SITE_NAME, description: "Design Formwork For Concrete", publisher: { "@id": ORG_ID }, inLanguage: LOCALE });
  graph.push({
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", inLanguage: LOCALE, "@id": `${SITE_URL}/#/schema/logo/image/`, url: LOGO.url, contentUrl: LOGO.url, width: LOGO.width, height: LOGO.height, caption: SITE_NAME },
    image: { "@id": `${SITE_URL}/#/schema/logo/image/` },
  });
  if (e.article) graph.push({ "@type": "Person", "@id": person, name: SITE_NAME });

  return [{ "@context": "https://schema.org", "@graph": graph }, professionalService];
}
