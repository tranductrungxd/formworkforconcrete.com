#!/usr/bin/env node
// Uploads every image in content/media-manifest.csv to the Cloudinary folder of this site and writes the
// resulting public ids and sizes back into the manifest.
//
// Cloudinary fetches each file from its `old_url` itself, so nothing is downloaded locally.
// Re-running is safe: rows that already have a public id are skipped, and assets that already exist in
// Cloudinary are never overwritten.
//
// Env (.env): CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (secret, never printed),
//             CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER (non-secret).
// Usage:  node scripts/upload-media.mjs [--dry-run]
import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import { loadEnv, manifestHeader, manifestPath, readManifest, writeCsv } from './media-lib.mjs';

const dryRun = process.argv.includes('--dry-run');
loadEnv();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const folder = (process.env.CLOUDINARY_FOLDER || '').replace(/^\/+|\/+$/g, '');
if (!cloudName || !folder || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in .env');
  process.exit(1);
}
cloudinary.config({ cloud_name: cloudName, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

// --- naming: <folder>/<group>/<file name without extension> ----------------------------------------------
function group(r) {
  const u = decodeURIComponent(r.old_url);
  const used = r.used_on.split(' ');
  if (/FormworkForConcrete-e\d+|favicon/i.test(u)) return 'brand';
  if (/Doka_logo|\/logo\.png|ulma_|Modular-Steel|ischebeck/i.test(u)) return 'systems';
  if (/i\.ytimg\.com/.test(u)) return 'home';
  if (used.length && used.every((x) => x.startsWith('post:'))) return 'posts';
  if (used.some((x) => x.startsWith('project:')) || /\/Projects\//.test(u)) return 'projects';
  return 'pages';
}
function baseName(url) {
  const parts = url.split('?')[0].split('/');
  let file = decodeURIComponent(parts.pop());
  // YouTube thumbnails are all called maxresdefault.jpg: use the video id instead.
  if (/i\.ytimg\.com/.test(url)) file = `video-${parts.pop()}-${file}`;
  return file
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const rows = readManifest();
const todo = rows.filter((r) => !r.cloudinary_public_id);
console.log(`${rows.length} rows, ${todo.length} to upload -> ${cloudName}:${folder}/`);

const used = new Set(rows.map((r) => r.cloudinary_public_id).filter(Boolean));
for (const r of todo) {
  let id = `${folder}/${group(r)}/${baseName(r.old_url)}`;
  while (used.has(id)) id += '-2';
  used.add(id);
  r._id = id;
}
if (dryRun) {
  for (const r of todo) console.log(r._id, '<-', r.old_url);
  process.exit(0);
}

// Images that already live in this cloud keep their public id (plan section 5: "images already on Cloudinary keep
// their current URLs"); only their size is read, nothing is uploaded or copied.
const OWN = new RegExp(`^https://res\\.cloudinary\\.com/${cloudName}/image/upload/(?:[^/]+/)*?v\\d+/(.+?)(?:\\.[a-z0-9]+)?$`, 'i');
async function adopt(r) {
  const id = decodeURIComponent(r.old_url.match(OWN)[1]);
  try {
    const res = await cloudinary.api.resource(id);
    r.width = res.width ?? '';
    r.height = res.height ?? '';
    r.cloudinary_public_id = res.public_id;
    console.log('adopted', res.public_id, `${res.width}x${res.height}`);
  } catch (e) {
    console.error('FAILED ', r.old_url, '-', e?.error?.message || e?.message || String(e));
  }
}

async function upload(r) {
  if (OWN.test(r.old_url)) return adopt(r);
  const assetFolder = r._id.split('/').slice(0, -1).join('/');
  const name = r._id.split('/').pop();
  try {
    const res = await cloudinary.uploader.upload(r.old_url, {
      public_id: r._id,
      asset_folder: assetFolder,
      display_name: name,
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      resource_type: 'image',
    });
    r.width = res.width ?? '';
    r.height = res.height ?? '';
    r.cloudinary_public_id = res.public_id;
    console.log(res.existing ? 'exists ' : 'ok     ', res.public_id, `${res.width}x${res.height}`);
  } catch (e) {
    console.error('FAILED ', r.old_url, '-', e?.error?.message || e?.message || String(e));
  }
}

const queue = [...todo];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await upload(queue.shift()); }));

fs.writeFileSync(manifestPath, writeCsv(rows, manifestHeader));
const left = rows.filter((r) => !r.cloudinary_public_id).length;
console.log(left ? `Done with ${left} failures (re-run to retry).` : 'All rows uploaded.');
process.exit(left ? 1 : 0);
