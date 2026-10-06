#!/usr/bin/env node
// Cuts a tall full-page screenshot into viewer-sized slices, so each slice is readable.
//   node scripts/slice-shot.mjs <in.png> <out-dir> [slice-height]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const [inFile, outDir, sliceH = '1700'] = process.argv.slice(2);
if (!inFile || !outDir) { console.error('Usage: node scripts/slice-shot.mjs <in.png> <out-dir> [slice-height]'); process.exit(2); }
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const dir = fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop();
const sub = fs.readdirSync(path.join(cache, dir)).find((d) => d.startsWith('chrome-headless-shell-'));
const browser = await chromium.launch({ executablePath: path.join(cache, dir, sub, 'chrome-headless-shell') });
const page = await browser.newPage();
fs.mkdirSync(outDir, { recursive: true });
// An image opened directly is scaled to the window; wrapped in a page it keeps its natural size.
const wrapper = path.join(path.resolve(outDir), '_wrapper.html');
fs.writeFileSync(wrapper, `<body style="margin:0;background:#fff"><img src="${pathToFileURL(path.resolve(inFile)).href}" style="display:block">`);
await page.goto(pathToFileURL(wrapper).href);
const { w, h } = await page.evaluate(() => ({ w: document.images[0].naturalWidth, h: document.images[0].naturalHeight }));
await page.setViewportSize({ width: w, height: Number(sliceH) });
let i = 0;
for (let y = 0; y < h; y += Number(sliceH)) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.screenshot({ path: path.join(outDir, String(i).padStart(2, '0') + '.png') });
  i++;
}
fs.rmSync(wrapper);
console.log(`${i} slices of ${w}x${h}`);
await browser.close();
