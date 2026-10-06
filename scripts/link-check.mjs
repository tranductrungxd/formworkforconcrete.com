#!/usr/bin/env node
// Link check over the static export (out/): every internal href / src must point at a file or page in out/, every
// #anchor must exist on its target page, and no link may point at a redirect source or lack the trailing slash.
//   node scripts/link-check.mjs            (after `pnpm build`)
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { parseCsv, root } from './media-lib.mjs';

const out = path.join(root, 'out');
const redirects = parseCsv(fs.readFileSync(path.join(root, 'seo-baseline/redirects.formworkforconcrete.com.csv'), 'utf8'));
const redirectSources = new Set(redirects.map((r) => r.from.replace(/\/$/, '')));

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html' || e.name === '404.html') pages.push(p);
  }
})(out);

const idsOf = new Map();
function ids(file) {
  if (!idsOf.has(file)) {
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
    idsOf.set(file, new Set($('[id]').toArray().map((el) => $(el).attr('id'))));
  }
  return idsOf.get(file);
}

let problems = 0;
let checked = 0;
const bad = (page, msg) => { problems++; console.log(`  ${path.relative(out, page) || 'index.html'}: ${msg}`); };

for (const page of pages) {
  const $ = cheerio.load(fs.readFileSync(page, 'utf8'));
  const refs = [];
  $('a[href]').each((_, el) => refs.push(['href', $(el).attr('href')]));
  $('img[src],script[src],link[href]').each((_, el) => refs.push(['asset', $(el).attr('src') ?? $(el).attr('href')]));
  for (const [kind, raw] of refs) {
    if (!raw || /^(https?:|mailto:|tel:|data:|\/\/)/.test(raw)) continue;
    const [pathPart, hash] = raw.split('#');
    const clean = pathPart.split('?')[0];
    checked++;
    const target = clean === '' ? page : path.join(out, clean);
    if (clean === '') {
      if (hash && !ids(page).has(hash)) bad(page, `#${hash} not found on the same page`);
      continue;
    }
    if (kind === 'href') {
      if (!clean.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(clean)) bad(page, `link without trailing slash: ${raw}`);
      if (redirectSources.has(clean.replace(/\/$/, ''))) bad(page, `link to a redirect source: ${raw}`);
    }
    const file = clean.endsWith('/') ? path.join(target, 'index.html') : target;
    if (!fs.existsSync(file)) { bad(page, `${kind} target missing: ${raw}`); continue; }
    if (hash && file.endsWith('.html') && !ids(file).has(hash)) bad(page, `#${hash} not found on ${clean}`);
  }
}
console.log(`${pages.length} pages, ${checked} internal references checked.`);
console.log(problems ? `${problems} problem(s).` : 'No broken links.');
process.exit(problems ? 1 : 0);
