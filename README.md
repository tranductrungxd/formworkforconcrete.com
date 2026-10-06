# formworkforconcrete.com: Next.js rebuild

Static Next.js 16 site (App Router, TypeScript, **Tailwind CSS v4**) that replaces the WordPress site, built from
`plans/rebuild-formworkforconcrete-nextjs.md`. The plan describes Hostinger hosting; the site is hosted on **AWS Amplify**
like oceanbim.com (see "Hosting"). `pnpm build` writes the deployable site to `out/`. The pages are static; the contact form
talks to a small Lambda service (`services/contact`, the same one as on oceanbim.com).

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm build                     # -> out/  (runs media:gen first)
pnpm lint                      # also part of the Amplify build
pnpm media:warm                # after every build/deploy: pre-generates the Cloudinary image variants
pnpm seo:check http://localhost:4173     # serve out/ first, e.g. `pnpm dlx serve out -l 4173`
pnpm links:check               # every internal link, asset and #anchor of out/ resolves
pnpm text:check                # every text block of the old WordPress pages is in the new build (needs extract/)
pnpm form:test                 # contact service tests (no AWS needed)
pnpm form:build                # bundle the contact service -> services/contact/dist/index.mjs
```

## What is where

| Path | What |
|---|---|
| `app/` | One `page.tsx` per URL: `/`, `/contact-us/`, `/projects/`, `/projects/[slug]/` (11), `/news/`, `/[slug]/` (the 5 posts, at the root of the site as on WordPress), `not-found.tsx` (becomes `out/404.html`), `sitemap.ts`, `robots.ts`. |
| `components/ui` | The design system: `Header` (mega menus, side panel, mobile menu), `Footer`, `Button`, `Frame`/`Column`/`Label` (the hairline grid), `Img`, `Markdown`, `ContactForm`, `Analytics`, `HeroVideo`. Written to be lifted into `packages/ui` for the oceanbim.com rebuild. |
| `components/sections`, `components/pages` | Page sections and the page templates. |
| `content/` | All copy. `home.ts`, `pages.ts`, `site.ts`, `form.ts` are typed TS; `projects/*.md` and `posts/*.md` are Markdown with front matter; `seo.ts` is the baseline title/description/canonical/og/JSON-LD facts of every URL (generated, see below); `media-manifest.csv` maps every image to Cloudinary. |
| `lib/` | `seo.ts` (metadata), `jsonld.ts` (JSON-LD graphs), `content.ts` (reads the Markdown), `media.ts`, `image-loader.ts` (Cloudinary), `fonts.ts` (Manrope). |
| `public/wp-content/uploads/` | The 21 files the og:image, JSON-LD logo and favicon URLs still point to, so those URLs keep working after the domain moves. |
| `services/contact/` | The contact form backend (Lambda, TypeScript, 20 tests). |
| `infrastructure/` | Terraform for the AWS side (uploads bucket, secret, contact Lambda, SES, Amplify app settings, redirects). See its README. |
| `amplify.yml`, `customHttp.yml` | Amplify build spec and response headers (caching, security). Same as oceanbim.com. |
| `seo-baseline/` | Read-only copy of the SEO baseline of 2026-10-04 that the checks compare against. |
| `scripts/` | Media pipeline, checks, and the one-time WordPress migration tools (see below). |
| `extract/` | Gitignored scratch: page HTML, Elementor JSON, screenshots of the old site. Only needed for `text:check`, `pnpm shots` and re-running the migration. |

Styling is Tailwind utilities plus the design tokens in `app/globals.css` (`@theme`): brand orange `#FC5220`, near-black
`#191817`, text `#4A4A4A`, hairlines `#E6E9EB`, Manrope, 1280px container, bold uppercase headings. Values come from the
Elementor kit of the old site.

## Media (Cloudinary)

All images are in the shared Cloudinary cloud **`oceanbim`**, folder **`formworkforconcrete.com/`** (subfolders `brand`,
`pages`, `projects`, `posts`, `systems`, `home`). Images that were already hosted in that cloud (the project drawings) keep
their existing public ids and are not copied. The copy still refers to images by their old WordPress URL;
`content/media.generated.ts` (generated from `content/media-manifest.csv`) maps each of them to its Cloudinary id, so a
missing image fails the build.

> **The `.env` has the wrong cloud name.** The API key and secret in `.env` are the `oceanbim` cloud's (identical to
> oceanbim.com's), and a cloud called `formworkforconcrete` does not exist. `.env.local` (gitignored) overrides
> `CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` with `oceanbim`. Fix `.env` if you want it to match.

To add an image to the copy: use its URL in `content/*.ts` or a `.md` file, then `pnpm media:scan && pnpm media:upload`
(Cloudinary fetches the file from that URL). Open-graph images stay on `formworkforconcrete.com/wp-content/uploads/…`
exactly as in the baseline; those files are in `public/`.

## Contact form

`/contact-us/#contact-form` (every contact button of the site links there). `ContactForm` talks to the contact service
(`services/contact`, a Lambda behind a function URL, `NEXT_PUBLIC_FORM_ENDPOINT`): Cloudflare Turnstile against bots, a
honeypot and a 3 s minimum fill time, Amazon SES for the mail, files straight to a private S3 bucket (up to 6 files, 50 MB
in total; pdf, dwg, dxf, ifc, rvt, zip, jpg, png), 30-day signed download links in the mail. On success it fires the GA4
event `generate_lead`. Without `NEXT_PUBLIC_FORM_ENDPOINT` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` the form shows the email
address instead of submitting. The recipient and sender are Terraform variables (`contact_to_email`, `contact_from_email`).

## SEO

`pnpm seo:check <url>` fetches every baseline URL and compares title, description, canonical, robots, `<html lang>`,
og:title/description/image, H1 and the JSON-LD `@type`s with the baseline, plus robots.txt, the sitemap, the 404 status
and every internal link; with `--redirects` it also checks the 301 rules on a deployed host. The 20 kept URLs pass with zero
differences. Approved differences (plan section 6): `/category/blog-post/` and `/author/pjzadb73wk/` are not rebuilt and
301 to `/news/`; the sitemap moved to `/sitemap.xml`; the contact form is new. Two small JSON-LD choices: the WebSite has no
`SearchAction` (the new site has no search), and the post author is "Formwork for concrete" instead of the WordPress username.

## Hosting (AWS Amplify)

Static export, Amplify platform `WEB`, as for oceanbim.com. `infrastructure/` creates the bucket, secret, Lambda and, once the
console-created app is adopted, the app settings and the 24 redirect rules that replace `.htaccess`
(`infrastructure/redirects.tf`, generated from `seo-baseline/redirects.formworkforconcrete.com.csv`). Response headers are in
`customHttp.yml`. **Nothing has been deployed and nothing has been created in AWS yet.**

## Analytics and chat

GA4 `G-YR5V883PZR` (gtag.js, as before, no cookie banner). The old site also loads the **Smartsupp live chat** (key in the
WPCode header scripts; the plan said "no chat widget", which was wrong). It is kept and loads when the browser is idle after
the page load. Set `NEXT_PUBLIC_SMARTSUPP_KEY=""` to switch it off. Neither has a consent banner (neither had one before);
if EU visitors matter, a consent step should be added.

## Migration tools (one time, kept for reference)

`scripts/elementor-to-md.py` and `scripts/build-content.py` turned the extract of the WordPress site (WP-CLI read-only:
page HTML, Elementor JSON, Yoast data) into `content/seo.ts`, `content/projects/*.md` and `content/posts/*.md`. Those files are
now the source of truth; edit them directly. `scripts/screenshots.mjs` takes full-page screenshots of every baseline URL at 1440
and 390 (`pnpm shots https://formworkforconcrete.com extract/screenshots/old`), `scripts/slice-shot.mjs` cuts them into readable slices.

## Known differences and open points (owner)

- **Cloudinary:** see the note above (cloud name).
- **Recipient of the form**, SES mail domain, Turnstile widget, Amplify app and GitHub repository: see `infrastructure/README.md`.
- **Empty half of the "Contact us for free quotation" band** on project pages: the old template points at a photo that does not
  exist on the server either (`pexels-laura-tancredi-7078502.jpg`). Pick a photo to fill it.
- **Image alt text:** WordPress alt text is kept; where it was empty, a plain description was added (project drawings, the two
  project cards on the home page).
- **Contrast:** the small white text on the orange expertise panel of the home page is 3.3:1 (brand colours of the old site),
  below WCAG AA for body text.
- **Old uploads:** only the 21 og/logo/favicon files ship. Other old `/wp-content/uploads/…` URLs (hotlinks, Google image
  results) stop working when the domain moves to Amplify; shipping the whole 114 MB folder is possible if wanted.
- **Footer:** the "CDE (oceanBIM App)" link of the old footer was removed on request.
- **Search Console export** (Pages, last 12 months) is still needed before the cutover, as in the plan.
