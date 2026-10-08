#!/usr/bin/env node
// Copy fidelity check: every visible text block of the old WordPress page (extract/html/<page>.html) must appear in
// the new page (out/<path>/index.html). Header, footer, menus and scripts are ignored on both sides, and so is the
// old post-to-post navigation (.elementor-post-info): its links change as posts are added.
//   node scripts/text-diff.mjs            (after `pnpm build`)
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { root, parseCsv } from './media-lib.mjs';

const baseline = parseCsv(fs.readFileSync(path.join(root, 'seo-baseline/formworkforconcrete.com.pages.csv'), 'utf8'));
const norm = (s) => s.replace(/[‘’′]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/ |​/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const STRIP = 'script,style,noscript,svg,header,footer,nav,.elementor-location-header,.elementor-location-footer,[data-elementor-type="popup"],.vamtam-scroll-to-top,#scroll-to-top,.elementor-nav-menu,.elementor-menu-toggle,#smartsupp-widget-container,.elementor-post-info,[class*="rocket"],.screen-reader-text,.elementor-screen-only';

// Old text replaced on purpose (website audit, 2026-10-07): the quote band of the project template now names the next step.
const REPLACED = new Set([
  'contact us for free quotation',
  'contact us for a free consultation, customized to meet the specific needs of your project',
  'contact us',
]);

function load(file) {
  const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
  $(STRIP).remove();
  $('br').replaceWith(' '); // a line break separates words even though it has no whitespace of its own
  return $;
}

let missing = 0;
for (const b of baseline) {
  const p = b.url.replace('https://formworkforconcrete.com', '');
  if (p === '/author/pjzadb73wk/' || p === '/category/blog-post/') continue;
  const oldFile = path.join(root, 'extract/html', (p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home') + '.html');
  const newFile = path.join(root, 'out', p, 'index.html');
  const $old = load(oldFile);
  const $new = load(newFile);
  const haystack = norm($new('body').text());
  const blocks = new Set();
  $old('main, body').first().find('p,h1,h2,h3,h4,h5,h6,li,figcaption,.elementor-button-text,.elementor-icon-list-text,.elementor-cta__title,.elementor-cta__description,.elementor-tab-title a,.elementor-tab-content').each((_, el) => {
    // skip containers whose text is built from child blocks that are checked on their own
    if ($old(el).find('p,h1,h2,h3,h4,h5,h6,li').length) return;
    const t = norm($old(el).text());
    if (t.length > 2 && !REPLACED.has(t)) blocks.add(t);
  });
  const miss = [...blocks].filter((t) => !haystack.includes(t));
  console.log(`${p}  ${blocks.size - miss.length}/${blocks.size} blocks found${miss.length ? '' : ''}`);
  for (const m of miss) { console.log('   MISSING:', m.slice(0, 160)); missing++; }
}
console.log(missing ? `\n${missing} text block(s) of the old pages are missing in the new build.` : '\nEvery text block of the old pages is in the new build.');
process.exit(missing ? 1 : 0);
