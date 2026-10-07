// All copy of the home page, verbatim from the WordPress page (Elementor page 17 and its section templates).
import type { MediaUrl } from "./media.generated";

const wp = (path: string) => `https://formworkforconcrete.com/wp-content/uploads/${path}` as MediaUrl;

export const home = {
  hero: {
    h1: "Formwork Design That Keeps Your Pour on Schedule",
    lead: "We turn your structural drawings into buildable formwork layouts, quantified schedules and pour sequences — in Doka, ULMA, Symons, Soloform, or the timber and plywood already in your yard.",
    facts: "5 years · 50+ projects delivered · United States · Canada · Australia",
    primary: "Send Your Drawings",
    secondary: { label: "See Our Projects", href: "/projects/" },
    video: { id: "USFsVL9uJtM", title: "Formwork For Concrete Animation", poster: "https://i.ytimg.com/vi/USFsVL9uJtM/maxresdefault.jpg" as MediaUrl },
  },
  // New 2026-10-07: clients the owner has worked for (logos supplied by the owner, in Cloudinary under clients/).
  clients: {
    label: "Clients",
    heading: "Trusted by Concrete Contractors",
    text: "Some of the contractors we have designed and drawn formwork for.",
    logos: [
      { name: "Sercon Construction", image: "https://res.cloudinary.com/oceanbim/image/upload/v1791378450/formworkforconcrete.com/clients/sercon-construction.png" as MediaUrl },
      { name: "L7 Construction, Inc.", image: "https://res.cloudinary.com/oceanbim/image/upload/v1791378449/formworkforconcrete.com/clients/l7-construction.png" as MediaUrl },
      { name: "C&R Concrete Construction, Inc.", image: "https://res.cloudinary.com/oceanbim/image/upload/v1791378478/formworkforconcrete.com/clients/cr-concrete-construction.png" as MediaUrl },
      { name: "Gael Form Ltd.", image: "https://res.cloudinary.com/oceanbim/image/upload/v1791378448/formworkforconcrete.com/clients/gael-form.png" as MediaUrl },
      { name: "Wayne E. Swisher Cement Contractor, Inc.", image: "https://res.cloudinary.com/oceanbim/image/upload/v1791378450/formworkforconcrete.com/clients/wayne-e-swisher-cement-contractor.png" as MediaUrl },
    ],
  },
  problems: {
    heading: "Where Formwork Goes Wrong",
    intro: "Most formwork problems don’t start on site. They start in the drawings.",
    items: [
      { lead: "Layouts that don’t match your yard", text: "panels get rented late, at the wrong price." },
      { lead: "Ties and pressures never checked", text: "blowouts, honeycombing, and a rework crew you didn’t budget for." },
      { lead: "No pour sequence", text: "concrete ordered against the wrong plan while crews stand idle." },
      { lead: "Quantities estimated, not calculated", text: "over-ordering on every single lift." },
    ],
    closing: "We settle all four before the first panel is set.",
  },
  solutions: {
    label: "Solutions",
    heading: "Design & Drafting",
    cards: [
      {
        id: "production-formwork-layout",
        title: "Production Formwork Layouts",
        paragraphs: [
          "Panel-by-panel layouts your crew can build from — every tie, waler, prop and stripping line drawn and dimensioned.",
          "We work from your architectural and structural set, including irregular geometry, curved walls and transfer slabs, and hand back drawings a foreman can read without phoning the office.",
        ],
        image: wp("2023/08/Formwork-Core-walls-1-jpg-e1726644404291.webp"),
      },
      {
        id: "bill-of-qualities-and-detailed-schedule",
        title: "Bills of Quantities You Can Order From",
        paragraphs: [
          "Every panel, tie, prop and accessory counted off the 3D model — not estimated off a plan.",
          "Your buyer orders against real numbers, your QS prices against real numbers, and rental durations are set against the pour schedule so you’re not paying for forms sitting idle.",
        ],
        image: wp("2024/09/concrete-formowrk-walls.png"),
      },
      {
        id: "concrete-pourmap-phasing",
        title: "Pour Maps & Concreting Sequences",
        paragraphs: [
          "Lift by lift, in the order you’ll actually build it, with the concrete volume for each pour calculated alongside it. Your team knows what’s going up this week — and exactly how much to order for it.",
        ],
        image: wp("2023/08/formwork-concrete-design-oceanbim-nfpc1-jpg.webp"),
      },
      {
        id: "modular-systems-design",
        title: "Design Around the Materials You Already Have",
        paragraphs: [
          "Own your forms? Renting? Working with local plywood and timber? We design to what’s actually available to you, not to a catalog you’d have to buy into.",
          "Where a modular system fits, we specify it. Where your own material works harder, we detail that instead.",
        ],
        image: wp("2023/08/Formwork-walls-gang-form-1.jpg"),
      },
    ],
  },
  structures: {
    heading: "Support Various Types of Structures",
    paragraphs: [
      "From a single foundation to a full high-rise core, we design formwork for civil, infrastructure and building work at any scale. Already holding a supplier’s proposal?",
      "We’ll review it against your schedule and tell you whether it’s the right system for the job — or what would work better.",
    ],
    image: wp("2024/09/formwork-for-concrete-on-the-structure-min-scaled.webp"),
    imageAlt: "Formwork props and timber beams supporting a concrete slab",
    button: "Send Your Drawings",
    label: "We design formwork for",
    columns: [
      ["Civil", "Infrastructure", "Renovation", "Buildings"],
      ["Office", "Residential", "Government", "Manufacturing"],
      ["Slabs", "Foundations", "Beams & Girders", "Columns", "Walls & Stair Cores", "Elevator Cores"],
    ],
  },
  scaffolding: {
    label: "BIM Modeling",
    heading: "Scaffolding & Shoring Shop Drawings",
    button: "Talk to Us About Your Scaffold",
    items: [
      {
        title: "Dimensioned for the crew, not just for approval",
        text: "Plans, typical elevations and sections at a working scale, with cross-sections and projected components shown. Every member dimensioned — so the crew erecting it isn't interpreting intent.",
      },
      {
        title: "Whatever system you're erecting",
        text: "Tube and coupler, prefabricated H-frame and portal frame, and hybrid arrangements using prefabricated uprights with cross-beams. If you're combining systems, we detail the connection between them.",
      },
    ],
    image: wp("2024/09/formwork-for-concrete-scaffolding-min.png"),
  },
  deliverables: {
    label: "What you receive",
    heading: "What Lands in Your Inbox",
    items: [
      {
        title: "3D Formwork BIM Model",
        text: "Every panel, tie, waler and prop modeled and clash-checked against your rebar before anything ships.",
        href: "/projects/brb-mbr-structure/",
        image: wp("2024/09/formwork-concrete-model-3D-jpg.webp"),
      },
      {
        title: "Schedule & Quantity Table",
        text: "Counted off the model panel by panel, with rental durations tied to the pour schedule.",
        href: "/projects/kyle-dam-foundation/",
        image: wp("2024/09/formwork-concrete-schedule-jpg.webp"),
      },
      {
        title: "Formwork Detail Drawings",
        text: "Plans, elevations and sections, fully dimensioned and ready to hand straight to the foreman.",
        href: "/projects/ajax-foundation/",
        image: wp("2024/09/formwork-concrete-formwork-detailing-jpg.webp"),
      },
      {
        title: "Panel Assembly Sheets",
        text: "Assembly and stripping detail for each panel type, including tie positions and lifting points.",
        href: "/projects/formwork-core-walls/",
        image: wp("2024/09/formwork-concrete-detail-panel-jpg.webp"),
      },
      {
        title: "Browser Access for the Site Team",
        text: "Model and quantities open from a browser link on the oceanBIM cloud platform. No license, no install, nothing to learn.",
        href: "/projects/formwork-preliminary-treatment-facility/",
        image: wp("2024/09/formwork-concrete-phases-jpg.webp"),
      },
      {
        title: "Scaffolding & Shoring Design",
        text: "Falsework and access designed alongside the formwork, not bolted on afterwards.",
        href: "/projects/formwork-peitro-carnaghi-foudation/",
        image: wp("2024/10/Scaffold-min.png"),
      },
    ],
  },
  process: {
    heading: "How We Work",
    steps: [
      { lead: "1. Send your drawings", text: "your structural and architectural set, plus whatever formwork you own or plan to rent." },
      { lead: "2. We scope and quote", text: "a fixed price against a defined deliverable list. No hourly surprises." },
      { lead: "3. You get the package", text: "model, drawings, quantities and pour sequence." },
      { lead: "4. We stay on through the pour", text: "revisions and answers while the work is actually going up." },
    ],
  },
  expertise: {
    label: "Expertise",
    heading: "Five Years, Fifty-Plus Projects, Three Countries",
    paragraphs: [
      "We’ve delivered formwork and shoring design across the United States, Canada and Australia — dams and treatment plants, furnace foundations, elevator cores and high-rise structures.",
      "Long enough to have seen how it goes wrong on site, and to draw it so it doesn’t.",
    ],
    button: "Start a Project",
    image: wp("2024/09/construction-worker-leveling-wet-cement-into-wood-min-scaled.webp"),
    imageAlt: "Worker levelling wet concrete against a timber form",
  },
  projects: {
    label: "Work",
    heading: "PROJECTS",
    more: "More projects",
    cards: [
      {
        title: "Ajax Foundation",
        text: "Ajax Tocco 85 Ton Furnace Foundation. Design Formwork and Concreting Pourmap for Concrete Structure",
        href: "/projects/ajax-foundation/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670405255/marketing/Web%20design/FormworkForConcrete/Projects/Ajax%20foundation/ajax-foundation-concrete-formwork-cover_anloro.jpg" as MediaUrl,
        alt: "Completed concrete formwork for Ajax Foundation project",
      },
      {
        title: "MBR/BRB Complex",
        text: "Speers CSO Treatment Facility",
        href: "/projects/brb-mbr-structure/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670492032/marketing/Web%20design/FormworkForConcrete/Projects/MBR/mbr-concrete-formwork_dylwgi.jpg" as MediaUrl,
        alt: "MBR and BRB complex formwork model",
      },
      {
        title: "Kyle Dam",
        text: "Dam renovations, Partial auxiliary spillway replacement",
        href: "/projects/kyle-dam-foundation/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670491996/marketing/Web%20design/FormworkForConcrete/Projects/Kyle%20Dam/kyle-damp-concrete-formwork-min_hwrqaj.jpg" as MediaUrl,
        alt: "Shuttering design and concrete pour at Kyle Dam construction site",
      },
      {
        title: "Preliminary Treatment Facility",
        text: "Two-story structural building. Complete formwork design and drawings.",
        href: "/projects/formwork-preliminary-treatment-facility/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670492051/marketing/Web%20design/FormworkForConcrete/Projects/PTF/ptf-concrete-formwork_hmlbfb.jpg" as MediaUrl,
        alt: "foundation-concrete-formwork",
      },
      {
        title: "Elevator Walls",
        text: "Design and drawings for structural core wall formwork.",
        href: "/projects/formwork-core-walls/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670492070/marketing/Web%20design/FormworkForConcrete/Projects/Soloform/soloform-concrete-formwork_shp7t0.jpg" as MediaUrl,
        alt: "Elevator core wall formwork model",
      },
      {
        title: "Pietro Carnaghi AP Foundation",
        text: "Renovation of a concrete structure: removal of part of the existing Ingersoll foundation and replacement with a new structure.",
        href: "/projects/formwork-peitro-carnaghi-foudation/",
        image: "https://res.cloudinary.com/oceanbim/image/upload/v1670558772/marketing/Web%20design/FormworkForConcrete/Projects/NFPC/nfpc-concrete-formwork_kdk8fo.jpg" as MediaUrl,
        alt: "Construction site showing advanced formwork for a civil infrastructure project",
      },
    ],
  },
  systems: {
    heading: "We design in the system you’re already using",
    text: "Doka, ULMA, Symons Steel-Ply, Soloform, aluminium systems — or your own timber and plywood. We don’t sell formwork, so the system we specify is the one that suits your job.",
    center: wp("2024/10/Modular-Steel-Construction-min.png"),
    centerAlt: "3D BIM model of custom residential concrete formwork design",
    items: [
      {
        logo: wp("2024/03/Doka_logo_web-jpg.webp"),
        logoAlt: "Doka",
        href: "https://www.doka.com/en/index",
        text: "Doka 3D formwork and scaffolding components modeled directly into the design.",
      },
      {
        logo: "https://res.cloudinary.com/oceanbim/image/upload/v1670816093/marketing/Web%20design/FormworkForConcrete/Branchs/ulma_uxnhjx.png" as MediaUrl,
        logoAlt: "ULMA",
        href: "https://www.ulmaconstruction.com/en/formwork",
        text: "The full ULMA range for forming any concrete structure — rental or purchase.",
      },
      {
        logo: wp("2024/10/logo.png"),
        logoAlt: "Ischebeck Titan",
        href: "https://www.ischebeckcan.com/products/soloform",
        text: "Ischebeck Soloform handset panels, including the 8′ × 8′ Super Soloform for crane-set assemblies.",
      },
      { title: "Aluminium Formwork System", text: "Walls, slabs, columns and beams in one system — down to stairs, window hoods, balconies and ornamental detail." },
      { title: "Symons Steel-Ply Forming System", text: "Steel-Ply forming, laid out for your pour rather than pulled straight from the catalog." },
      { title: "Your Own Formwork", text: "We detail around the lumber, whalers and plywood available in your local market — cutting waste and labor instead of adding a rental line." },
    ],
  },
  ready: {
    heading: "Ready to Get Your Formwork Drawn?",
    paragraphs: [
      "Formwork and shoring design for reinforced concrete — slabs, walls, foundations, columns and cores.",
      "Send us your structural set and tell us what you’re building with, and we’ll come back with a scope, a price and a delivery date.",
      "Working with contractors across the United States, Canada and Australia.",
    ],
  },
} as const;
