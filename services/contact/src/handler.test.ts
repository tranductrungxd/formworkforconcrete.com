import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { parseConfig, parseMailAddresses, type Config } from "./config.ts";
import { createHandler, type Deps } from "./handler.ts";
import { downloadUrl, verifyDownload } from "./links.ts";
import type { Mailer } from "./mail.ts";
import type { Store } from "./store.ts";
import { parseSubmit, safeFileName } from "./validate.ts";

const ORIGIN = "https://formworkforconcrete.com";
const HOST = "abc123.lambda-url.ap-southeast-1.on.aws";
const KEY = "k".repeat(40);
const CONFIG: Config = { turnstileSecret: "ts", downloadSigningKey: KEY };
const ADDRESSES = { to: "contact@formworkforconcrete.com", from: "forms@formworkforconcrete.com" };

/** In-memory S3, a fake SES mailer and a fake Turnstile endpoint. */
function setup(opts: { turnstile?: { success: boolean; hostname?: string; action?: string }; mailOk?: boolean; config?: Config | null } = {}) {
  const objects = new Map<string, { json?: unknown; size: number }>();
  const posts: string[] = [];
  const mails: Parameters<Mailer["send"]>[0][] = [];
  let ids = 0;

  const store: Store = {
    putJson: async (key, value) => void objects.set(key, { json: value, size: JSON.stringify(value).length }),
    getJson: async <T>(key: string) => (objects.get(key)?.json as T | undefined) ?? null,
    head: async (key) => (objects.has(key) ? { size: objects.get(key)!.size } : null),
    copy: async (from, to) => void objects.set(to, objects.get(from)!),
    presignPost: async (key, max) => (posts.push(key), { url: "https://bucket.s3.amazonaws.com/", fields: { key, max: String(max) } }),
    presignGet: async (key, name) => `https://signed.example/${encodeURIComponent(key)}?name=${encodeURIComponent(name)}`,
  };

  const fakeFetch = (async (url: string | URL | Request) => {
    const u = String(url);
    if (u.includes("turnstile")) {
      const t = opts.turnstile ?? { success: true, hostname: "formworkforconcrete.com", action: "contact" };
      return new Response(JSON.stringify(t), { status: 200 });
    }
    throw new Error(`unexpected fetch ${u}`);
  }) as typeof fetch;

  const deps: Deps = {
    store,
    loadConfig: async () => (opts.config === undefined ? CONFIG : opts.config),
    addresses: ADDRESSES,
    mailer: { send: async (mail) => (mails.push(mail), opts.mailOk !== false) },
    fetch: fakeFetch,
    allowedOrigins: [ORIGIN, "https://main.d123.amplifyapp.com"],
    now: () => 1_800_000_000_000,
    randomId: () => (++ids).toString(16).padStart(32, "0"),
  };
  return { handler: createHandler(deps), objects, posts, mails };
}

function event(path: string, body: unknown, o: { method?: string; origin?: string | null; query?: Record<string, string> } = {}): LambdaFunctionURLEvent {
  const method = o.method ?? "POST";
  return {
    rawPath: path,
    headers: { ...(o.origin === null ? {} : { origin: o.origin ?? ORIGIN }), "content-type": "application/json" },
    queryStringParameters: o.query,
    body: typeof body === "string" ? body : JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: { domainName: HOST, http: { method } },
  } as unknown as LambdaFunctionURLEvent;
}

const form = (extra: Record<string, unknown> = {}) => ({
  name: "Ada Lovelace",
  company: "Analytical GmbH",
  email: "ada@example.com",
  country: "Germany",
  projectType: "slabs",
  message: "Please quote 12 floors of slab formwork.",
  elapsedMs: 8000,
  turnstileToken: "tok",
  files: [],
  ...extra,
});

const json = (r: { body?: string }) => JSON.parse(r.body ?? "{}");

describe("submit without files", () => {
  it("verifies the visitor, stores the record and sends one mail", async () => {
    const { handler, mails, objects } = setup();
    const res = (await handler(event("/submit", form()))) as { statusCode: number; body: string };
    assert.equal(res.statusCode, 200);
    assert.deepEqual(json(res), { ok: true });
    assert.equal(mails.length, 1);
    assert.equal(mails[0].replyTo, "ada@example.com");
    assert.equal(mails[0].to, "contact@formworkforconcrete.com");
    assert.equal(mails[0].from, "forms@formworkforconcrete.com");
    assert.match(String(mails[0].subject), /Ada Lovelace \(Analytical GmbH\)/);
    assert.doesNotMatch(String(mails[0].text), /Link to files/);
    assert.equal((objects.get(`submissions/${"1".padStart(32, "0")}/submission.json`)?.json as { mailed: boolean }).mailed, true);
  });

  it("reports a mail failure and keeps the record for follow-up", async () => {
    const { handler, objects } = setup({ mailOk: false });
    const res = (await handler(event("/submit", form()))) as { statusCode: number; body: string };
    assert.equal(res.statusCode, 502);
    assert.equal(json(res).error, "mail");
    assert.equal((objects.get(`submissions/${"1".padStart(32, "0")}/submission.json`)?.json as { mailed: boolean }).mailed, false);
  });
});

describe("submit with files", () => {
  const files = [
    { name: "plan 01.dwg", size: 30 * 1024 * 1024 },
    { name: "../../etc/passwd.pdf", size: 1000 },
  ];

  it("returns one presigned upload per file, sends no mail yet, and uses safe keys", async () => {
    const { handler, posts, mails } = setup();
    const res = (await handler(event("/submit", form({ files })))) as { statusCode: number; body: string };
    const body = json(res);
    assert.equal(res.statusCode, 200);
    assert.equal(body.uploads.length, 2);
    assert.equal(mails.length, 0);
    assert.ok(posts.every((k) => k.startsWith(`incoming/${body.id}/`) && !k.includes("..")));
    assert.equal(posts[1], `incoming/${body.id}/1-passwd.pdf`);
  });

  it("completes: moves the files, mails download links that verify, and is idempotent", async () => {
    const { handler, objects, mails } = setup();
    const submit = json((await handler(event("/submit", form({ files })))) as { body: string });
    // The browser uploads the files straight to S3.
    for (const [i, f] of files.entries()) {
      const name = i === 0 ? "plan 01.dwg" : "passwd.pdf";
      objects.set(`incoming/${submit.id}/${i}-${name}`, { size: f.size });
    }
    const done = (await handler(event("/complete", { id: submit.id }))) as { statusCode: number; body: string };
    assert.equal(done.statusCode, 200);
    assert.equal(mails.length, 1);

    const text = String(mails[0].text);
    const links = [...text.matchAll(/https:\/\/\S+\/d\?\S+/g)].map((m) => m[0]);
    assert.equal(links.length, 2);
    const q = Object.fromEntries(new URL(links[0]).searchParams);
    assert.equal(verifyDownload(q, 1_800_000_000_000, KEY), `submissions/${submit.id}/0-plan 01.dwg`);
    assert.equal(objects.has(`submissions/${submit.id}/0-plan 01.dwg`), true);

    const again = (await handler(event("/complete", { id: submit.id }))) as { statusCode: number };
    assert.equal(again.statusCode, 200);
    assert.equal(mails.length, 1, "a repeated complete must not send a second mail");
  });

  it("refuses to complete when a file never arrived", async () => {
    const { handler, mails } = setup();
    const submit = json((await handler(event("/submit", form({ files })))) as { body: string });
    const res = (await handler(event("/complete", { id: submit.id }))) as { statusCode: number; body: string };
    assert.equal(res.statusCode, 422);
    assert.equal(json(res).error, "files");
    assert.equal(mails.length, 0);
  });

  it("rejects unknown ids and malformed ids", async () => {
    const { handler } = setup();
    assert.equal(((await handler(event("/complete", { id: "f".repeat(32) }))) as { statusCode: number }).statusCode, 404);
    assert.equal(((await handler(event("/complete", { id: "../x" }))) as { statusCode: number }).statusCode, 422);
  });
});

describe("spam and abuse checks", () => {
  it("rejects other origins and missing origins", async () => {
    const { handler } = setup();
    for (const origin of ["https://evil.example", null]) {
      const res = (await handler(event("/submit", form(), { origin }))) as { statusCode: number };
      assert.equal(res.statusCode, 403);
    }
  });

  it("answers ok but does nothing when the honeypot is filled", async () => {
    const { handler, mails } = setup();
    const res = (await handler(event("/submit", form({ website: "http://spam" })))) as { statusCode: number };
    assert.equal(res.statusCode, 200);
    assert.equal(mails.length, 0);
  });

  it("rejects a form filled in under three seconds", async () => {
    const { handler } = setup();
    const res = (await handler(event("/submit", form({ elapsedMs: 1200 })))) as { statusCode: number; body: string };
    assert.equal(res.statusCode, 422);
    assert.equal(json(res).error, "too_fast");
  });

  it("rejects a Turnstile token from the wrong host or action", async () => {
    for (const turnstile of [{ success: false }, { success: true, hostname: "evil.example", action: "contact" }, { success: true, hostname: "formworkforconcrete.com", action: "other" }]) {
      const { handler, mails } = setup({ turnstile });
      const res = (await handler(event("/submit", form()))) as { statusCode: number; body: string };
      assert.equal(res.statusCode, 422);
      assert.equal(json(res).error, "verification");
      assert.equal(mails.length, 0);
    }
  });

  it("accepts the staging origin when Turnstile was solved on that host", async () => {
    const { handler, mails } = setup({ turnstile: { success: true, hostname: "main.d123.amplifyapp.com", action: "contact" } });
    const res = (await handler(event("/submit", form(), { origin: "https://main.d123.amplifyapp.com" }))) as { statusCode: number };
    assert.equal(res.statusCode, 200);
    assert.equal(mails.length, 1);
  });

  it("rejects bad files: type, count, total size", async () => {
    const { handler } = setup();
    const bad = [
      [{ name: "virus.exe", size: 10 }],
      Array.from({ length: 11 }, (_, i) => ({ name: `a${i}.pdf`, size: 10 })),
      [{ name: "a.pdf", size: 130 * 1024 * 1024 }, { name: "b.pdf", size: 130 * 1024 * 1024 }],
      [{ name: "a.pdf", size: 0 }],
    ];
    for (const files of bad) {
      const res = (await handler(event("/submit", form({ files })))) as { statusCode: number; body: string };
      assert.equal(res.statusCode, 422);
      assert.equal(json(res).error, "files");
    }
  });

  it("rejects oversized or non-JSON bodies and wrong routes", async () => {
    const { handler } = setup();
    assert.equal(((await handler(event("/submit", "x".repeat(20_000)))) as { statusCode: number }).statusCode, 413);
    assert.equal(((await handler(event("/submit", "{not json"))) as { statusCode: number }).statusCode, 400);
    assert.equal(((await handler(event("/other", {}))) as { statusCode: number }).statusCode, 404);
    assert.equal(((await handler(event("/submit", {}, { method: "GET" }))) as { statusCode: number }).statusCode, 404);
  });

  it("returns 503 when the private settings are missing", async () => {
    const { handler } = setup({ config: null });
    assert.equal(((await handler(event("/submit", form()))) as { statusCode: number }).statusCode, 503);
  });
});

describe("download links", () => {
  const key = "submissions/abc/0-plan.dwg";
  const query = (url: string) => Object.fromEntries(new URL(url).searchParams);
  const url = downloadUrl(`https://${HOST}`, key, 1_800_000_000_000, KEY);

  it("redirects a genuine link to a short-lived signed URL", async () => {
    const { handler } = setup();
    const res = (await handler(event("/d", "", { method: "GET", origin: null, query: query(url) }))) as { statusCode: number; headers: Record<string, string> };
    assert.equal(res.statusCode, 302);
    assert.match(res.headers.location, /signed\.example/);
    assert.match(res.headers.location, /name=plan\.dwg/);
  });

  it("refuses tampered, expired and foreign-key links", async () => {
    const { handler } = setup();
    const expired = 1_800_000_000_000 + 31 * 86400 * 1000;
    assert.equal(verifyDownload(query(url), expired, KEY), null);
    assert.equal(verifyDownload({ ...query(url), k: "submissions/other/0-x.pdf" }, 1_800_000_000_000, KEY), null);
    assert.equal(verifyDownload({ ...query(url), s: "00".repeat(32) }, 1_800_000_000_000, KEY), null);
    assert.equal(verifyDownload({ ...query(downloadUrl("https://x", "incoming/a/0-x.pdf", 1_800_000_000_000, KEY)) }, 1_800_000_000_000, KEY), null);
    const res = (await handler(event("/d", "", { method: "GET", origin: null, query: { ...query(url), s: "00".repeat(32) } }))) as { statusCode: number };
    assert.equal(res.statusCode, 404);
  });
});

describe("helpers", () => {
  it("makes file names safe", () => {
    assert.equal(safeFileName("../../a b.pdf"), "a b.pdf");
    assert.equal(safeFileName("C:\\x\\plan:1?.dwg"), "plan_1_.dwg");
    assert.equal(safeFileName(".hidden.pdf"), "hidden.pdf");
    assert.ok(safeFileName(`${"n".repeat(300)}.ifc`).endsWith(".ifc"));
    assert.ok(safeFileName(`${"n".repeat(300)}.ifc`).length <= 100);
  });

  it("flags unknown project types as other and requires the core fields", () => {
    const r = parseSubmit(form({ projectType: "weird" }));
    assert.equal(r.ok && !r.honeypot && r.value.projectType, "other");
    assert.deepEqual(parseSubmit(form({ email: "nope" })), { ok: false, error: "invalid" });
    assert.deepEqual(parseSubmit(form({ message: "  " })), { ok: false, error: "invalid" });
  });

  it("accepts 10 files and 250 MB in total", () => {
    const files = Array.from({ length: 10 }, (_, i) => ({ name: `a${i}.pdf`, size: 25 * 1024 * 1024 }));
    const r = parseSubmit(form({ files }));
    assert.equal(r.ok && !r.honeypot && r.value.files.length, 10);
  });

  it("keeps an https link to files, puts it in the mail and refuses other links", async () => {
    const link = "https://www.dropbox.com/scl/fo/abc/drawings?dl=0";
    const r = parseSubmit(form({ filesLink: ` ${link} ` }));
    assert.equal(r.ok && !r.honeypot && r.value.filesLink, link);
    for (const bad of ["http://example.com/a", "javascript:alert(1)", "dropbox", "https://localhost/x"]) {
      assert.deepEqual(parseSubmit(form({ filesLink: bad })), { ok: false, error: "invalid" });
    }
    const { handler, mails } = setup();
    await handler(event("/submit", form({ filesLink: link })));
    assert.ok(String(mails[0].text).includes(`Link to files: ${link}`));
  });

  it("keeps the source of the visit, drops junk, and lists it in the mail", async () => {
    const source = { landing: "/formwork-design-for-a-suspended-concrete-slab/", referrer: "https://www.google.com/", ctaPage: "/projects/kyle-dam-foundation/", utmSource: "", evil: "x", utmCampaign: 42 };
    const r = parseSubmit(form({ source }));
    assert.deepEqual(r.ok && !r.honeypot && r.value.source, { landing: source.landing, referrer: source.referrer, ctaPage: source.ctaPage });
    const junk = parseSubmit(form({ source: "nope" }));
    assert.deepEqual(junk.ok && !junk.honeypot && junk.value.source, {});
    const { handler, mails } = setup();
    await handler(event("/submit", form({ source })));
    const text = String(mails[0].text);
    assert.ok(text.includes("- Landing page: /formwork-design-for-a-suspended-concrete-slab/"));
    assert.ok(text.includes("- Quote button clicked on: /projects/kyle-dam-foundation/"));
    const { handler: h2, mails: m2 } = setup();
    await h2(event("/submit", form()));
    assert.ok(String(m2[0].text).includes("- unknown (direct visit"));
  });

  it("only accepts a complete secret", () => {
    const good = { turnstileSecret: "s", downloadSigningKey: KEY };
    assert.ok(parseConfig(good));
    assert.ok(parseConfig({ ...good, to: "old@x.com", from: "old@x.com" }), "leftover address keys in the secret are ignored");
    assert.equal(parseConfig({ ...good, turnstileSecret: "" }), null);
    assert.equal(parseConfig({ ...good, downloadSigningKey: "short" }), null);
    assert.equal(parseConfig(null), null);
  });

  it("reads the addresses from plain settings and refuses bad ones", () => {
    assert.deepEqual(parseMailAddresses(" contact@formworkforconcrete.com ", "forms@formworkforconcrete.com"), ADDRESSES);
    assert.throws(() => parseMailAddresses(undefined, "forms@formworkforconcrete.com"), /CONTACT_TO/);
    assert.throws(() => parseMailAddresses("contact@formworkforconcrete.com", "not-an-address"), /CONTACT_FROM/);
  });
});
