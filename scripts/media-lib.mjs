// Shared helpers of the media scripts: .env loading and a small RFC 4180 CSV reader/writer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const manifestPath = path.join(root, 'content', 'media-manifest.csv');
export const manifestHeader = ['old_url', 'local_file', 'width', 'height', 'alt', 'used_on', 'cloudinary_public_id'];

export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (fs.existsSync(p)) process.loadEnvFile(p);
  }
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const esc = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export function writeCsv(rows, header = manifestHeader) {
  return [header.join(','), ...rows.map((r) => header.map((h) => esc(String(r[h] ?? ''))).join(','))].join('\n') + '\n';
}

export function readManifest() {
  return fs.existsSync(manifestPath) ? parseCsv(fs.readFileSync(manifestPath, 'utf8')) : [];
}
