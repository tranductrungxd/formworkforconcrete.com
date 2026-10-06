import { createHmac, timingSafeEqual } from "node:crypto";

// Download links in the notification email. The bucket is private and presigned URLs made by a Lambda
// role stop working after a few hours, so the email carries our own signed link instead. It is valid
// for LINK_DAYS and, when opened, redirects to a presigned URL that lives for one minute.

export const LINK_DAYS = 30;

const sign = (key: string, expires: number, secret: string) => createHmac("sha256", secret).update(`${key}\n${expires}`).digest("hex");

export function downloadUrl(base: string, key: string, now: number, secret: string): string {
  const expires = Math.floor(now / 1000) + LINK_DAYS * 86400;
  const q = new URLSearchParams({ k: key, e: String(expires), s: sign(key, expires, secret) });
  return `${base}/d?${q.toString()}`;
}

/** Returns the object key when the link is genuine and not expired, otherwise null. */
export function verifyDownload(query: Record<string, string | undefined>, now: number, secret: string): string | null {
  const { k, e, s } = query;
  if (!k || !e || !s || !/^\d+$/.test(e)) return null;
  if (!k.startsWith("submissions/") || k.includes("..")) return null;
  if (Number(e) < Math.floor(now / 1000)) return null;
  const expected = Buffer.from(sign(k, Number(e), secret), "hex");
  const given = Buffer.from(s, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return k;
}
