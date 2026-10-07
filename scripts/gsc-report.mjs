#!/usr/bin/env node
// Search Console review after the move to the new site: one Markdown report per run in reports/gsc/ (git-ignored:
// the repo is public). No dependencies; it signs the service-account login itself (same method as ../oceanbim.com/scripts/gsc.mjs).
//
//   GSC_KEY_FILE=/path/to/service-account.json node scripts/gsc-report.mjs [--auto] [--notify]
//
//   --auto    for the scheduled run: weekly until WEEKLY_UNTIL, then only in the first week of each month
//   --notify  macOS notification with the headline when done
//
// The report: last 7 days against the 7 before, top pages and queries (28 days), the live status of every URL with
// impressions (a 404 there loses traffic), the sitemaps, the index status of the key pages, and a list of flags.
import { createSign } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "sc-domain:formworkforconcrete.com";
const ORIGIN = "https://formworkforconcrete.com";
const CUTOVER = "2026-10-07"; // DNS moved from WordPress (Hostinger) to Amplify
const WEEKLY_UNTIL = "2026-11-18"; // six weeks after the cutover, then monthly
const KEY_URLS = ["/", "/contact-us/", "/projects/", "/formwork-design-for-a-suspended-concrete-slab/", "/formwork-shop-drawings-and-construction-joint-layout/"];

const args = new Set(process.argv.slice(2));
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
if (args.has("--auto") && iso(today) > WEEKLY_UNTIL && today.getDate() > 7) {
  console.log(`${iso(today)}: monthly phase, next report in the first week of next month.`);
  process.exit(0);
}

const keyFile = process.env.GSC_KEY_FILE;
if (!keyFile) {
  console.error("Set GSC_KEY_FILE to the service-account key (kept outside the repo).");
  process.exit(1);
}

async function login() {
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: key.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 };
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(claims)}`;
  const assertion = `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(key.private_key).toString("base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Login failed: ${json.error} ${json.error_description ?? ""}`);
  return json.access_token;
}

const token = await login();
async function api(url, body) {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${json.error?.message ?? ""}`);
  return json;
}
const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}`;
const query = (start, end, dimensions = [], rowLimit = 1000) =>
  api(`${base}/searchAnalytics/query`, { startDate: iso(start), endDate: iso(end), dimensions, rowLimit, type: "web" }).then((r) => r.rows ?? []);

// Search Console data lags about 2 to 3 days.
const day = 86400000;
const end = new Date(today.getTime() - 3 * day);
const daysBack = (n, from = end) => new Date(from.getTime() - (n - 1) * day);
const prevEnd = new Date(daysBack(7).getTime() - day);

const sum = (rows) => {
  const clicks = rows.reduce((n, r) => n + r.clicks, 0);
  const impressions = rows.reduce((n, r) => n + r.impressions, 0);
  const position = impressions ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position };
};
const [thisWeek, lastWeek] = (await Promise.all([query(daysBack(7), end), query(daysBack(7, prevEnd), prevEnd)])).map(sum);
const pages = await query(daysBack(28), end, ["page"], 200);
const queries = await query(daysBack(28), end, ["query"], 25);
const sitemaps = (await api(`${base}/sitemaps`)).sitemap ?? [];

// Live status of every URL that had impressions: redirects are fine, 4xx/5xx lose traffic.
const live = [];
for (const r of pages) {
  const url = r.keys[0];
  let status = "error";
  try {
    status = (await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) })).status;
  } catch {
    // network error stays "error"
  }
  live.push({ url, status, impressions: r.impressions });
}

const inspected = [];
for (const p of KEY_URLS) {
  try {
    const { inspectionResult: r } = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: ORIGIN + p, siteUrl: SITE });
    const i = r.indexStatusResult ?? {};
    inspected.push({ path: p, verdict: i.verdict, coverage: i.coverageState, lastCrawl: i.lastCrawlTime?.slice(0, 10) ?? "-", googleCanonical: i.googleCanonical ?? "-" });
  } catch (e) {
    inspected.push({ path: p, verdict: "ERROR", coverage: String(e.message), lastCrawl: "-", googleCanonical: "-" });
  }
}

// Flags: what needs a look.
const flags = [];
const change = (a, b) => (b ? (a - b) / b : 0);
if (lastWeek.clicks >= 10 && change(thisWeek.clicks, lastWeek.clicks) < -0.3) flags.push(`Clicks down ${Math.round(-100 * change(thisWeek.clicks, lastWeek.clicks))}% week on week.`);
for (const l of live) if (l.status === "error" || l.status >= 400) flags.push(`${l.url} answers ${l.status} and had ${l.impressions} impressions (28 days).`);
for (const s of sitemaps) if (Number(s.errors) > 0) flags.push(`Sitemap ${s.path} has ${s.errors} errors.`);
if (!sitemaps.some((s) => s.path === `${ORIGIN}/sitemap.xml`)) flags.push("The new sitemap is not submitted.");
for (const i of inspected) {
  if (i.verdict !== "PASS") flags.push(`${i.path}: ${i.verdict} (${i.coverage}).`);
  else if (i.googleCanonical !== "-" && i.googleCanonical !== ORIGIN + i.path) flags.push(`${i.path}: Google picked ${i.googleCanonical} as canonical.`);
}

const pct = (x) => `${(100 * x).toFixed(2)}%`;
const delta = (a, b) => (b ? ` (${a >= b ? "+" : ""}${Math.round(100 * change(a, b))}%)` : "");
const md = [];
md.push(`# Search Console report, ${iso(today)}`, "");
md.push(`Data up to ${iso(end)} (Search Console lags about 3 days). New site live since ${CUTOVER}.`, "");
md.push("## Flags", "", ...(flags.length ? flags.map((f) => `- ${f}`) : ["- None."]), "");
md.push("## Last 7 days against the 7 before", "");
md.push("| | Last 7 days | 7 days before |", "|---|---|---|");
md.push(`| Clicks | ${thisWeek.clicks}${delta(thisWeek.clicks, lastWeek.clicks)} | ${lastWeek.clicks} |`);
md.push(`| Impressions | ${thisWeek.impressions}${delta(thisWeek.impressions, lastWeek.impressions)} | ${lastWeek.impressions} |`);
md.push(`| CTR | ${pct(thisWeek.ctr)} | ${pct(lastWeek.ctr)} |`);
md.push(`| Average position | ${thisWeek.position.toFixed(1)} | ${lastWeek.position.toFixed(1)} |`, "");
md.push("## Top pages (28 days)", "", "| Page | Clicks | Impressions | CTR | Position |", "|---|---|---|---|---|");
for (const r of pages.slice(0, 12)) md.push(`| ${r.keys[0].replace(ORIGIN, "")} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${r.position.toFixed(1)} |`);
md.push("", "## Top queries (28 days)", "", "| Query | Clicks | Impressions | CTR | Position |", "|---|---|---|---|---|");
for (const r of queries) md.push(`| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${r.position.toFixed(1)} |`);
md.push("", "## Live status of URLs with impressions (28 days)", "");
const byStatus = live.reduce((m, l) => ((m[l.status] = (m[l.status] ?? 0) + 1), m), {});
md.push(Object.entries(byStatus).map(([s, n]) => `${n} × ${s}`).join(", ") || "No URLs with impressions.", "");
md.push("## Sitemaps", "", "| Sitemap | Last downloaded | Errors | Submitted / indexed |", "|---|---|---|---|");
for (const s of sitemaps) md.push(`| ${s.path} | ${s.lastDownloaded?.slice(0, 10) ?? "pending"} | ${s.errors} | ${(s.contents ?? []).map((c) => `${c.type} ${c.submitted}/${c.indexed ?? "?"}`).join(", ")} |`);
md.push("", "## Key pages in Google's index", "", "| Page | Verdict | Coverage | Last crawl |", "|---|---|---|---|");
for (const i of inspected) md.push(`| ${i.path} | ${i.verdict} | ${i.coverage} | ${i.lastCrawl} |`);
md.push("");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "reports", "gsc");
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${iso(today)}.md`);
fs.writeFileSync(file, md.join("\n"));

const headline = `${thisWeek.clicks} clicks${delta(thisWeek.clicks, lastWeek.clicks)}, ${flags.length} flag${flags.length === 1 ? "" : "s"}`;
console.log(`${headline}\n${file}`);
if (args.has("--notify")) {
  const script = `display notification ${JSON.stringify(headline)} with title "formworkforconcrete.com – Search Console" subtitle "Report ${iso(today)}"`;
  try {
    execFileSync("osascript", ["-e", script]);
  } catch {
    // no notification outside macOS
  }
}
