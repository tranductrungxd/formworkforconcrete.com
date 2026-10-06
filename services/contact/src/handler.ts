import type { LambdaFunctionURLEvent, LambdaFunctionURLResult } from "aws-lambda";
import type { Config, MailAddresses } from "./config.ts";
import { downloadUrl, verifyDownload } from "./links.ts";
import { buildEmail, type Mailer, type StoredFile } from "./mail.ts";
import type { Store } from "./store.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { BODY_LIMIT, parseSubmit, type Submission } from "./validate.ts";

/*
 * Routes (Lambda function URL, CORS is configured on the URL by Terraform):
 *   POST /submit    Form fields as JSON. Checks spam, then either sends the mail (no files, through SES) or answers
 *                   with one presigned S3 upload per file.
 *   POST /complete  {id}. After the browser has uploaded the files: checks they arrived, moves them to
 *                   submissions/, sends the mail with download links.
 *   GET  /d         Signed link from the mail. Redirects to a one-minute presigned S3 URL.
 *
 * Upload flow in S3:  incoming/<id>/...  (deleted after 2 days, so abandoned uploads vanish)
 *                  -> submissions/<id>/... (kept for the retention period)
 */

export interface Deps {
  store: Store;
  loadConfig: () => Promise<Config | null>;
  addresses: MailAddresses;
  mailer: Mailer;
  /** Used for the Turnstile check. */
  fetch: typeof fetch;
  allowedOrigins: string[];
  now: () => number;
  randomId: () => string;
}

interface Record_ {
  id: string;
  createdAt: string;
  submission: Submission;
  files: StoredFile[];
  mailed: boolean;
}

const ID_RE = /^[a-f0-9]{32}$/;
const UPLOAD_SECONDS = 15 * 60;
const RATE = { limit: 30, windowMs: 10 * 60 * 1000 };

const reply = (statusCode: number, body: unknown, headers: Record<string, string> = {}): LambdaFunctionURLResult => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  body: JSON.stringify(body),
});
const fail = (statusCode: number, error: string) => reply(statusCode, { ok: false, error });

export function createHandler(deps: Deps) {
  const { store } = deps;
  const allowed = new Set(deps.allowedOrigins);
  // Best effort only: each Lambda instance keeps its own count. Turnstile is the real control.
  let bucket = { count: 0, resetAt: 0 };
  const rateLimited = () => {
    const now = deps.now();
    if (now > bucket.resetAt) bucket = { count: 0, resetAt: now + RATE.windowMs };
    return ++bucket.count > RATE.limit;
  };

  async function finalize(rec: Record_, files: StoredFile[], config: Config, base: string) {
    const stored: Record_ = { ...rec, files, mailed: false };
    await store.putJson(`submissions/${rec.id}/submission.json`, stored);
    const links = files.map((file) => ({ file, url: downloadUrl(base, file.key, deps.now(), config.downloadSigningKey) }));
    const mail = buildEmail(rec.submission, links);
    const sent = await deps.mailer.send({ ...mail, from: deps.addresses.from, to: deps.addresses.to, replyTo: rec.submission.email });
    if (!sent) return false;
    await store.putJson(`submissions/${rec.id}/submission.json`, { ...stored, mailed: true });
    return true;
  }

  async function submit(body: unknown, origin: string, base: string) {
    const parsed = parseSubmit(body);
    if (!parsed.ok) return fail(422, parsed.error);
    if (parsed.honeypot) return reply(200, { ok: true });

    const config = await deps.loadConfig();
    if (!config) return fail(503, "server");

    const verified = await verifyTurnstile(deps.fetch, {
      secret: config.turnstileSecret,
      token: parsed.turnstileToken,
      expectedHostname: new URL(origin).hostname,
    });
    if (!verified) return fail(422, "verification");

    const id = deps.randomId();
    const files = parsed.value.files.map((f, i) => ({ name: f.name, size: f.size, key: `incoming/${id}/${i}-${f.name}` }));
    const rec: Record_ = { id, createdAt: new Date(deps.now()).toISOString(), submission: parsed.value, files, mailed: false };

    if (files.length === 0) {
      return (await finalize(rec, [], config, base)) ? reply(200, { ok: true }) : fail(502, "mail");
    }
    await store.putJson(`incoming/${id}/submission.json`, rec);
    const uploads = await Promise.all(files.map((f) => store.presignPost(f.key, f.size, UPLOAD_SECONDS)));
    return reply(200, { ok: true, id, uploads });
  }

  async function complete(body: unknown, base: string) {
    const id = body && typeof body === "object" ? (body as { id?: unknown }).id : undefined;
    if (typeof id !== "string" || !ID_RE.test(id)) return fail(422, "invalid");

    const done = await store.getJson<Record_>(`submissions/${id}/submission.json`);
    if (done?.mailed) return reply(200, { ok: true });

    const rec = await store.getJson<Record_>(`incoming/${id}/submission.json`);
    if (!rec) return fail(404, "invalid");

    const config = await deps.loadConfig();
    if (!config) return fail(503, "server");

    const moved: StoredFile[] = [];
    for (const [i, file] of rec.files.entries()) {
      const head = await store.head(file.key);
      if (!head || head.size < 1 || head.size > file.size) return fail(422, "files");
      const key = `submissions/${id}/${i}-${file.name}`;
      await store.copy(file.key, key);
      moved.push({ name: file.name, size: head.size, key });
    }
    return (await finalize(rec, moved, config, base)) ? reply(200, { ok: true }) : fail(502, "mail");
  }

  async function download(query: Record<string, string | undefined>): Promise<LambdaFunctionURLResult> {
    const config = await deps.loadConfig();
    const key = config ? verifyDownload(query, deps.now(), config.downloadSigningKey) : null;
    if (!key) {
      return { statusCode: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }, body: "This link has expired or is not valid." };
    }
    const fileName = key.split("/").pop()?.replace(/^\d+-/, "") ?? "file";
    const location = await store.presignGet(key, fileName, 60);
    return { statusCode: 302, headers: { location, "cache-control": "no-store", "referrer-policy": "no-referrer" } };
  }

  return async (event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> => {
    try {
      const method = event.requestContext.http.method;
      const path = event.rawPath;
      const base = `https://${event.requestContext.domainName}`;

      if (method === "GET" && path === "/d") return await download(event.queryStringParameters ?? {});
      if (method !== "POST" || (path !== "/submit" && path !== "/complete")) return fail(404, "not_found");

      // Cross-site and non-JSON writes are refused before the body is read.
      const origin = event.headers.origin ?? "";
      if (!allowed.has(origin)) return fail(403, "origin");
      if (!(event.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) return fail(415, "invalid");
      if (rateLimited()) return fail(429, "rate");

      const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : (event.body ?? "");
      if (Buffer.byteLength(raw) > BODY_LIMIT) return fail(413, "invalid");
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return fail(400, "invalid");
      }

      return path === "/submit" ? await submit(body, origin, base) : await complete(body, base);
    } catch (e) {
      // Only the error name goes to the log: messages can contain visitor input.
      console.error("contact handler failed:", e instanceof Error ? e.name : "unknown");
      return fail(500, "server");
    }
  };
}
