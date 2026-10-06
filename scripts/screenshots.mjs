#!/usr/bin/env node
// Full-page screenshots of every baseline URL at 1440x900 and 390x844, for the old/new comparison.
//
//   node scripts/screenshots.mjs https://formworkforconcrete.com extract/screenshots/old
//   node scripts/screenshots.mjs http://localhost:3000 extract/screenshots/new
//
// Uses the Chromium that Playwright already cached on this machine (PLAYWRIGHT_CHROMIUM overrides the path).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] ?? '').replace(/\/$/, '');
const outDir = path.resolve(root, process.argv[3] ?? 'extract/screenshots');
const only = process.argv[4]; // optional: one path ("/news/") or a prefix ending in * ("/projects/*")
if (!base) { console.error('Usage: node scripts/screenshots.mjs <base-url> [out-dir] [path-filter]'); process.exit(2); }

const csv = fs.readFileSync(path.join(root, 'seo-baseline/formworkforconcrete.com.pages.csv'), 'utf8');
const urls = [...csv.matchAll(/^(https:\/\/formworkforconcrete\.com[^,]*),/gm)].map((m) => m[1].replace('https://formworkforconcrete.com', ''));

function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const dir = fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop();
  if (!dir) throw new Error('No Playwright chromium_headless_shell in ' + cache);
  const sub = fs.readdirSync(path.join(cache, dir)).find((d) => d.startsWith('chrome-headless-shell-'));
  return path.join(cache, dir, sub, 'chrome-headless-shell');
}

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: findChromium() });
for (const [label, size] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const p of urls.filter((u) => !only || u === only || (only.endsWith('*') && u.startsWith(only.slice(0, -1))))) {
    const name = (p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home') + `-${label}.png`;
    try {
      await page.goto(base + p, { waitUntil: 'load', timeout: 90000 });
      // Lazy images and scroll-triggered animations: scroll through the page once, force every image to load and
      // wait until all of them are decoded, then go back to the top.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 20000); }))));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, name), fullPage: true });
      console.log('ok  ', name);
    } catch (e) { console.error('FAIL', name, e.message.split('\n')[0]); }
  }
  await ctx.close();
}
await browser.close();
