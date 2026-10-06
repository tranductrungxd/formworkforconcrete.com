#!/usr/bin/env node
// Finds every image URL the copy refers to (content/*.ts, content/projects/*.md, content/posts/*.md) and adds the
// ones that are missing to content/media-manifest.csv. The old WordPress URL is the key the code uses; the
// Cloudinary public id is filled in by `pnpm media:upload`.
//
// Alt text comes from, in this order: the Markdown image, `coverAlt` in the front matter, WordPress (extract/meta/alt-by-src.json).
// Existing rows keep their public id, size and alt; only used_on is refreshed.
//
// Usage: node scripts/media-scan.mjs
import fs from 'node:fs';
import path from 'node:path';
import { manifestHeader, manifestPath, readManifest, root, writeCsv } from './media-lib.mjs';

const URL_RE = /https?:\/\/(?:formworkforconcrete\.com\/wp-content\/uploads|res\.cloudinary\.com\/oceanbim|i\.ytimg\.com)\/[^\s"'`)\]\\]+?\.(?:webp|jpe?g|png|gif|svg)/gi;
const content = path.join(root, 'content');
const wpAlt = fs.existsSync(path.join(root, 'extract/meta/alt-by-src.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'extract/meta/alt-by-src.json'), 'utf8')) : {};

/** @type {Map<string, {alt: string, used: Set<string>}>} */
const found = new Map();
function add(url, usedOn, alt = '') {
  const entry = found.get(url) ?? { alt: '', used: new Set() };
  entry.used.add(usedOn);
  if (alt && !entry.alt) entry.alt = alt;
  found.set(url, entry);
}

function scanFile(file, usedOn) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.md')) {
    for (const m of text.matchAll(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g)) add(m[2], usedOn, m[1]);
    const cover = text.match(/^cover:\s*"([^"]+)"/m);
    const coverAlt = text.match(/^coverAlt:\s*"([^"]*)"/m);
    if (cover) add(cover[1], usedOn, coverAlt?.[1] ?? '');
    return;
  }
  for (const m of text.matchAll(URL_RE)) add(m[0], usedOn);
  // content/*.ts shorthand: wp("2024/09/file.webp") is https://formworkforconcrete.com/wp-content/uploads/2024/09/file.webp
  for (const m of text.matchAll(/\bwp\(\s*"([^"]+\.(?:webp|jpe?g|png|gif|svg))"\s*\)/gi)) add(`https://formworkforconcrete.com/wp-content/uploads/${m[1]}`, usedOn);
}

for (const f of fs.readdirSync(content)) {
  if (f.endsWith('.ts') && !['seo.ts', 'media.generated.ts'].includes(f)) scanFile(path.join(content, f), f.replace(/\.ts$/, ''));
}
for (const [dir, tag] of [['projects', 'project'], ['posts', 'post']]) {
  for (const f of fs.readdirSync(path.join(content, dir))) if (f.endsWith('.md')) scanFile(path.join(content, dir, f), `${tag}:${f.replace(/\.md$/, '')}`);
}

const rows = readManifest();
const byUrl = new Map(rows.map((r) => [r.old_url, r]));
let added = 0;
for (const [url, { alt, used }] of found) {
  const usedOn = [...used].sort().join(' ');
  const row = byUrl.get(url);
  if (row) { row.used_on = usedOn; if (!row.alt) row.alt = alt || wpAlt[url] || ''; continue; }
  rows.push({ old_url: url, local_file: '', width: '', height: '', alt: alt || wpAlt[url] || '', used_on: usedOn, cloudinary_public_id: '' });
  added++;
}
const unused = rows.filter((r) => !found.has(r.old_url));
rows.sort((a, b) => a.old_url.localeCompare(b.old_url));
fs.writeFileSync(manifestPath, writeCsv(rows, manifestHeader));
console.log(`${found.size} image URLs in the copy, ${added} new manifest rows, ${rows.length} rows in total.`);
if (unused.length) console.log(`${unused.length} manifest rows are no longer referenced:\n  ` + unused.map((r) => r.old_url).join('\n  '));
