#!/usr/bin/env node
/**
 * SEO regression check: fetches every URL of the baseline (seo-baseline/formworkforconcrete.com.pages.csv) from a
 * running site and compares title, description, canonical, robots, <html lang>, og:*, H1 and JSON-LD @types. Also
 * verifies the redirects, robots.txt, sitemap.xml, the 404 status, and that no internal link points at a redirect
 * source or lacks the trailing slash.
 *
 *   node scripts/seo-check.ts http://localhost:4173            (serve out/ first, e.g. `python3 -m http.server 4173 -d out`)
 *   node scripts/seo-check.ts https://main.<app-id>.amplifyapp.com --redirects
 *
 * Approved differences from the baseline (plan section 6) are listed at the end and are not counted as failures:
 *   - /category/blog-post/ and /author/pjzadb73wk/ are not rebuilt; they 301 to /news/ (checked with --redirects)
 *   - the sitemap moved to /sitemap.xml
 *   - a contact form was added on /contact-us/
 * Redirect checks need the host's redirect rules (infrastructure/redirects.tf), so they run only against a deployed site.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/seo-check.ts <base-url> [--auth user:pass] [--redirects]");
  process.exit(2);
}
const authArg = args[args.indexOf("--auth") + 1];
const headers: Record<string, string> = authArg && args.includes("--auth") ? { Authorization: "Basic " + Buffer.from(authArg).toString("base64") } : {};
const checkRedirects = args.includes("--redirects");
const PROD = "https://formworkforconcrete.com";

// --- tiny CSV reader ---------------------------------------------------------------------------
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [h, ...b] = rows;
  return b.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}

const baseline = parseCsv(fs.readFileSync(path.join(root, "seo-baseline/formworkforconcrete.com.pages.csv"), "utf8"));
const redirects = parseCsv(fs.readFileSync(path.join(root, "seo-baseline/redirects.formworkforconcrete.com.csv"), "utf8"));
const redirectSources = new Set(redirects.map((r) => r.from.replace(/\/$/, "")));
// Baseline pages that are not rebuilt on purpose: they 301 to /news/.
const dropped = new Set(redirects.filter((r) => baseline.some((b) => b.url === PROD + r.from)).map((r) => PROD + r.from));

let failures = 0;
const approved: string[] = [];
const fail = (url: string, what: string, expected: unknown, got: unknown) => {
  failures++;
  console.log(`  FAIL ${what}\n       expected: ${JSON.stringify(expected)}\n       got:      ${JSON.stringify(got)}`);
};

async function get(url: string, redirect: RequestRedirect = "follow") {
  return fetch(url, { headers, redirect });
}

/** Top-level @type values of every JSON-LD block (nested objects such as PostalAddress do not count). */
function jsonLdTypes($: cheerio.CheerioAPI, urlPath: string): string[] {
  const types = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      for (const d of Array.isArray(data) ? data : [data]) {
        for (const node of d["@graph"] ?? [d]) [node["@type"]].flat().forEach((t: string) => t && types.add(t));
      }
    } catch (e) {
      fail(urlPath, "JSON-LD is valid JSON", "valid", String(e));
    }
  });
  return [...types].sort();
}

console.log(`SEO check against ${base}\n`);
for (const b of baseline) {
  const urlPath = b.url.replace(PROD, "");
  if (dropped.has(b.url)) {
    console.log(`${urlPath}  [not rebuilt: redirects to /news/, checked with --redirects]`);
    approved.push(`${urlPath}: not rebuilt, 301 to /news/ (thin archive; the author slug exposes the WordPress username)`);
    continue;
  }
  const res = await get(base + urlPath);
  console.log(`${urlPath}  [${res.status}]`);
  if (res.status !== 200) { fail(urlPath, "HTTP status", 200, res.status); continue; }
  const html = await res.text();
  const $ = cheerio.load(html);
  const meta = (sel: string, attr = "content") => $(sel).attr(attr) ?? "";

  const eq = (what: string, expected: string, got: string) => { if (expected !== got) fail(urlPath, what, expected, got); };
  eq("title", b.title, $("title").first().text());
  eq("meta description", b.meta_description, meta('meta[name="description"]'));
  eq("robots", b.robots, meta('meta[name="robots"]'));
  eq("<html lang>", b.html_lang, $("html").attr("lang") ?? "");
  eq("og:title", b.og_title, meta('meta[property="og:title"]'));
  eq("og:description", b.og_description, meta('meta[property="og:description"]'));
  eq("og:image", b.og_image, meta('meta[property="og:image"]'));
  // canonical: always the production self URL, also on staging and preview hosts
  eq("canonical", b.canonical, meta('link[rel="canonical"]', "href"));

  // H1: exactly one, equal to the baseline text
  const h1s = $("h1").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  if (h1s.length !== 1) fail(urlPath, "exactly one <h1>", 1, h1s);
  else eq("h1 text", b.h1, h1s[0]);

  // JSON-LD @types
  const wanted = b.jsonld_types.split(", ").filter(Boolean).sort();
  const gotTypes = jsonLdTypes($, urlPath);
  if (JSON.stringify(wanted) !== JSON.stringify(gotTypes)) fail(urlPath, "JSON-LD @types", wanted, gotTypes);

  // internal links: absolute-path hrefs must end with "/" (or be a file) and must not be redirect sources
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").split("#")[0].split("?")[0];
    if (!href.startsWith("/") || href.startsWith("//")) return;
    if (!href.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(href)) fail(urlPath, "internal link without trailing slash", "…/", href);
    if (redirectSources.has(href.replace(/\/$/, ""))) fail(urlPath, "internal link to a redirect source", "final URL", href);
  });
  // images of the page must not be served from the old WordPress folders (they ship only for og:image)
  if (/(src|srcset)="[^"]*\/wp-content\/(?!uploads)/.test(html)) fail(urlPath, "no theme/plugin URLs in the page", "none", "found /wp-content/ outside uploads");
}

// --- robots.txt and sitemap.xml ---------------------------------------------------------------------
console.log("\n/robots.txt");
const robots = await (await get(base + "/robots.txt")).text();
if (!/Allow:\s*\//.test(robots) || !robots.includes(`Sitemap: ${PROD}/sitemap.xml`) || /Disallow:\s*\S/.test(robots)) fail("/robots.txt", "allow all + sitemap line", "Allow: / + Sitemap: .../sitemap.xml", robots);
console.log("/sitemap.xml");
const sm = await (await get(base + "/sitemap.xml")).text();
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
const want = baseline.filter((b) => !dropped.has(b.url)).map((b) => b.url).sort();
if (JSON.stringify(locs) !== JSON.stringify(want)) fail("/sitemap.xml", "URLs = kept baseline URLs", want, locs);

// --- 404 -----------------------------------------------------------------------------------------------
console.log("/does-not-exist/");
const nf = await get(base + "/does-not-exist/");
if (nf.status !== 404) fail("/does-not-exist/", "HTTP status", 404, nf.status);

// --- redirects (needs the host's redirect rules, so only on a deployed site) -----------------------------------
if (checkRedirects) {
  console.log("\nredirects");
  for (const r of redirects) {
    for (const from of new Set([r.from, r.from.endsWith("/") ? r.from.slice(0, -1) : r.from + "/"])) {
      const res = await get(base + from, "manual");
      const loc = (res.headers.get("location") ?? "").replace(base, "").replace(PROD, "");
      if (res.status !== 301 || loc !== r.to) fail(from, `301 -> ${r.to}`, r.to, `${res.status} ${loc}`);
    }
  }
}

console.log("\nApproved differences from the baseline:");
for (const a of approved) console.log("  - " + a);
console.log("  - sitemap moved from /sitemap_index.xml to /sitemap.xml (old sitemap URLs redirect, checked with --redirects)");
console.log("  - a contact form was added on /contact-us/ (#contact-form); contact buttons link to it");
console.log(failures ? `\n${failures} FAILURE(S)` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
