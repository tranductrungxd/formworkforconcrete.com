// Input rules for the contact form: name, company, email, country, project type, message, an optional link to files
// hosted elsewhere and up to 10 files (pdf, dwg, dxf, ifc, rvt, zip, jpg, png; 250 MB in total). The files go straight
// from the browser to S3, so the size only costs upload time, not Lambda memory.

export const ALLOWED_EXT = ["pdf", "dwg", "dxf", "ifc", "rvt", "zip", "jpg", "jpeg", "png"];
// Must match the options of content/form.ts.
export const PROJECT_TYPES = ["foundations", "walls", "slabs", "beams-columns", "elevator-cores", "scaffolding", "other"];
export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
export const MIN_FILL_MS = 3000;
export const BODY_LIMIT = 16 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "" stays "", an https URL is kept as given, anything else is null (refused). */
function parseLink(raw: string): string | null {
  if (raw === "") return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.includes(".") ? raw : null;
  } catch {
    return null;
  }
}

export interface FileMeta {
  /** Display name, already safe to use in an object key and a header. */
  name: string;
  size: number;
}

export interface Submission {
  name: string;
  company: string;
  email: string;
  country: string;
  projectType: string;
  message: string;
  /** https link to files shared elsewhere (Drive, Dropbox, WeTransfer…), or "". */
  filesLink: string;
  files: FileMeta[];
}

export type ParseResult =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: Submission; turnstileToken: string }
  | { ok: false; error: "invalid" | "files" | "too_fast" };

/** Trims, drops control characters and caps the length. Single-line fields also lose line breaks. */
export function clean(v: unknown, max: number, multiline = false): string {
  let s = typeof v === "string" ? v.trim() : "";
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (!multiline) s = s.replace(/\s*[\r\n]+\s*/g, " ").trim();
  return s.slice(0, max);
}

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Keeps the base name and extension, replaces anything that could break a key, header or path. */
export function safeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = clean(base, 1000)
    .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
    .replace(/^\.+/, "")
    .replace(/ {2,}/g, " ")
    .trim();
  if (cleaned.length <= 100) return cleaned;
  // Shorten the name but keep the extension, which decides whether the file is accepted.
  const dot = cleaned.lastIndexOf(".");
  if (dot < 1) return cleaned.slice(0, 100);
  const ext = cleaned.slice(dot + 1);
  return `${cleaned.slice(0, Math.max(1, 99 - ext.length))}.${ext}`;
}

function parseFiles(raw: unknown): FileMeta[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_FILES) return null;
  const files: FileMeta[] = [];
  let total = 0;
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const { name, size } = item as { name?: unknown; size?: unknown };
    if (typeof name !== "string" || typeof size !== "number" || !Number.isInteger(size) || size < 1) return null;
    const safe = safeFileName(name);
    if (!safe || !ALLOWED_EXT.includes(extensionOf(safe))) return null;
    total += size;
    if (total > MAX_TOTAL_BYTES) return null;
    files.push({ name: safe, size });
  }
  return files;
}

export function parseSubmit(body: unknown): ParseResult {
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

  // A filled hidden field means a bot. The caller answers "ok" so it learns nothing.
  if (clean(b.website, 200) !== "") return { ok: true, honeypot: true };

  const name = clean(b.name, 120);
  const company = clean(b.company, 160);
  const email = clean(b.email, 160);
  const country = clean(b.country, 80);
  let projectType = clean(b.projectType, 40);
  const message = clean(b.message, 5000, true);
  const filesLink = parseLink(clean(b.filesLink, 500));
  const turnstileToken = typeof b.turnstileToken === "string" ? b.turnstileToken.trim() : "";

  if (name === "" || message === "" || !EMAIL_RE.test(email) || filesLink === null || !turnstileToken || turnstileToken.length > 2048) {
    return { ok: false, error: "invalid" };
  }
  if (projectType !== "" && !PROJECT_TYPES.includes(projectType)) projectType = "other";

  const elapsed = typeof b.elapsedMs === "number" ? b.elapsedMs : 0;
  if (elapsed < MIN_FILL_MS) return { ok: false, error: "too_fast" };

  const files = parseFiles(b.files);
  if (files === null) return { ok: false, error: "files" };

  return { ok: true, honeypot: false, turnstileToken, value: { name, company, email, country, projectType, message, filesLink, files } };
}
