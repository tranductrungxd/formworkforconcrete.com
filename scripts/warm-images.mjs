#!/usr/bin/env node
// Cloudinary generates each transformed image (a given width + format) on its first request,
// which costs 0.5-2 s. Run this after `pnpm build` and after every deploy so visitors never
// pay that first-request cost: it requests every res.cloudinary.com URL found in out/**/*.html.
//
// Usage: node scripts/warm-images.mjs [out-dir]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] ?? 'out');
if (!fs.existsSync(outDir)) {
  console.error(`${outDir} not found. Run "pnpm build" first.`);
  process.exit(1);
}

const urls = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/https:\/\/res\.cloudinary\.com\/[^\s"'<>\\]+/g)) urls.add(m[0].replace(/,$/, ''));
    }
  }
})(outDir);

const list = [...urls];
console.log(`Warming ${list.length} Cloudinary URLs…`);
let bad = 0;
const queue = [...list];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      try {
        // Same Accept header a browser sends, so f_auto derives the same (webp/avif) variants.
        const res = await fetch(u, { headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } });
        await res.arrayBuffer();
        if (!res.ok) { bad++; console.error(res.status, u); }
      } catch (e) { bad++; console.error('ERR', u, e.message); }
    }
  }),
);
console.log(bad ? `${bad} failed` : 'All warm.');
process.exit(bad ? 1 : 0);
