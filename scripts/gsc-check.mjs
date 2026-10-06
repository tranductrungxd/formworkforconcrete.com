#!/usr/bin/env node
// Search Console URL check. Takes the Pages export of the old site (seo-baseline/search-console-pages-*.csv) and, for
// every URL in it, says what the new site does: serves it (200), redirects it (301) or answers 404. The URLs that had
// clicks come first. With a base URL it also fetches every URL and compares.
//
//   node scripts/gsc-check.mjs                                  prediction only, from the build inputs
//   node scripts/gsc-check.mjs http://localhost:4173            also fetch (pages and files; redirects need --redirects)
//   node scripts/gsc-check.mjs https://main.<id>.amplifyapp.com --redirects
//
// Redirects are rules of the Amplify app (infrastructure/redirects.tf), so they only exist on a deployed host.
import fs from 'node:fs';
import path from 'node:path';
import { parseCsv, root } from './media-lib.mjs';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
const withRedirects = args.includes('--redirects');
const csvArg = args[args.indexOf('--csv') + 1];
const sbDir = path.join(root, 'seo-baseline');
const csvFile = args.includes('--csv') ? csvArg : path.join(sbDir, fs.readdirSync(sbDir).filter((f) => /^search-console-pages-.*\.csv$/.test(f)).sort().pop() ?? '');
if (!fs.existsSync(csvFile)) { console.error('No Search Console Pages export found (seo-baseline/search-console-pages-*.csv).'); process.exit(2); }

const PROD = 'https://formworkforconcrete.com';
const pages = parseCsv(fs.readFileSync(csvFile, 'utf8'));
const redirects = parseCsv(fs.readFileSync(path.join(sbDir, 'redirects.formworkforconcrete.com.csv'), 'utf8'));
const redirectTo = new Map();
for (const r of redirects) {
  const from = r.from.replace(/\/$/, '') || '/';
  redirectTo.set(from, r.to);
  if (!from.endsWith('.xml')) redirectTo.set(from + '/', r.to);
}
const kept = new Set(
  parseCsv(fs.readFileSync(path.join(sbDir, 'formworkforconcrete.com.pages.csv'), 'utf8'))
    .map((p) => p.url.replace(PROD, ''))
    .filter((p) => !redirectTo.has(p)),
);

/** What the new site should do with this path: { kind: '200' | '301' | '404', to? , note }. */
function expect(urlStr) {
  const u = new URL(urlStr);
  const p = u.pathname;
  if (redirectTo.has(p)) return { kind: '301', to: redirectTo.get(p), note: 'redirect rule' };
  if (kept.has(p)) return { kind: '200', note: u.search ? 'query string ignored by the static host' : 'page' };
  if (p !== '/' && !p.endsWith('/') && kept.has(p + '/')) return { kind: '301', to: p + '/', note: 'adds the trailing slash' };
  if (p.startsWith('/wp-content/uploads/')) return fs.existsSync(path.join(root, 'public', p)) ? { kind: '200', note: 'legacy file shipped in public/' } : { kind: '404', note: 'old upload not shipped' };
  return { kind: '404', note: 'no page, no rule' };
}

const rows = pages.map((r) => ({ url: r['Top pages'], clicks: +r.Clicks, impr: +r.Impressions, exp: expect(r['Top pages']) }));
rows.sort((a, b) => b.clicks - a.clicks || b.impr - a.impr);

let bad = 0;
const lines = [];
for (const r of rows) {
  let actual = '';
  if (base) {
    const isRedirect = r.exp.kind === '301';
    if (isRedirect && !withRedirects) actual = '  (redirect not checked: add --redirects on a deployed host)';
    else {
      try {
        const res = await fetch(base + new URL(r.url).pathname + new URL(r.url).search, { redirect: 'manual' });
        const loc = (res.headers.get('location') ?? '').replace(base, '').replace(PROD, '');
        const ok = isRedirect ? res.status === 301 && loc === r.exp.to : String(res.status) === r.exp.kind;
        actual = ok ? '  ✓' : `  ✗ got ${res.status}${loc ? ' -> ' + loc : ''}`;
        if (!ok) bad++;
      } catch (e) { actual = `  ✗ ${e.message}`; bad++; }
    }
  }
  lines.push(`${String(r.clicks).padStart(4)} clk ${String(r.impr).padStart(6)} imp  ${r.exp.kind}${r.exp.to ? ' -> ' + r.exp.to : ''}  [${r.exp.note}]  ${r.url.replace(PROD, '')}${actual}`);
}
console.log(`Search Console Pages export: ${path.basename(csvFile)}  (${rows.length} URLs)\n`);
console.log(lines.join('\n'));

const sum = (f) => rows.filter(f).reduce((n, r) => ({ c: n.c + r.clicks, i: n.i + r.impr }), { c: 0, i: 0 });
const tot = sum(() => true);
const lost = sum((r) => r.exp.kind === '404');
const lostClicks = rows.filter((r) => r.exp.kind === '404' && r.clicks > 0);
console.log(`\n${tot.c} clicks / ${tot.i} impressions in total.`);
console.log(`URLs that would 404: ${rows.filter((r) => r.exp.kind === '404').length}, with ${lost.c} clicks and ${lost.i} impressions.`);
if (lostClicks.length) console.log('Clicked URLs that would 404:\n  ' + lostClicks.map((r) => r.url).join('\n  '));
if (base) console.log(bad ? `\n${bad} URL(s) differ from the prediction.` : '\nEvery checked URL behaves as predicted.');
process.exit(bad || lostClicks.length ? 1 : 0);
