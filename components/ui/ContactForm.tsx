"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { form as t } from "@/content/form";
import { company } from "@/content/site";

// Must match services/contact/src/validate.ts.
const MAX_BYTES = 250 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED = ["pdf", "dwg", "dxf", "ifc", "rvt", "zip", "jpg", "jpeg", "png"];
// Both are public by design and inlined at build time (set by Terraform on the Amplify app).
const ENDPOINT = (process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "").trim().replace(/\/$/, "");
const TURNSTILE_SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; action?: string }) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

type Status = "idle" | "sending" | "ok" | "error";
type Reply = { ok?: boolean; error?: string; id?: string; uploads?: { url: string; fields: Record<string, string> }[] };

/** POST JSON to the contact service (services/contact). Never throws. */
async function post(path: string, body: unknown): Promise<{ ok: boolean; json: Reply }> {
  try {
    const res = await fetch(`${ENDPOINT}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Reply;
    return { ok: res.ok && json.ok === true, json };
  } catch {
    return { ok: false, json: {} };
  }
}

const field = "flex flex-col gap-1.5 text-[14px] font-bold text-ink";
const input = "min-h-12 border border-line bg-white p-3 text-[16px] font-normal text-ink focus:border-ink focus:outline-none";

/**
 * Talks to the contact service (services/contact, a Lambda behind a function URL):
 *   1. POST /submit with the fields and the file names. Spam protection is checked there: Cloudflare Turnstile,
 *      a honeypot field and the time the visitor took to fill the form.
 *   2. With files, the answer holds one upload URL per file. The browser sends each file straight to S3
 *      (a Lambda could not take 50 MB), then calls POST /complete so the service can send the mail.
 * On success it fires the GA4 event `generate_lead`.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const shownAt = useRef(0);
  const widgetBox = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    // Same clock as the event.timeStamp read on submit.
    shownAt.current = performance.now();
  }, []);

  const configured = ENDPOINT !== "" && TURNSTILE_SITE_KEY !== "";

  // Turnstile only auto-renders the widgets that exist when its script first runs, and next/script does not run it
  // again on a client-side navigation. So the widget is rendered explicitly on every mount.
  const mountWidget = useCallback(() => {
    const box = widgetBox.current;
    if (!box || !window.turnstile || widgetId.current !== null) return;
    widgetId.current = window.turnstile.render(box, { sitekey: TURNSTILE_SITE_KEY, action: "contact" });
  }, []);

  useEffect(() => {
    mountWidget();
    return () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [mountWidget]);

  function fail(message: string) {
    setStatus("error");
    setError(message);
    // A Turnstile token works once, so the visitor needs a fresh one to try again.
    window.turnstile?.reset(widgetId.current ?? undefined);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured || status === "sending") return;
    const elapsedMs = Math.round(e.timeStamp - shownAt.current);
    const data = new FormData(e.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");

    const files = (data.getAll("files") as File[]).filter((f) => f.size > 0);
    const total = files.reduce((n, f) => n + f.size, 0);
    const badType = files.some((f) => !ALLOWED.includes(f.name.split(".").pop()?.toLowerCase() ?? ""));
    if (total > MAX_BYTES || badType || files.length > MAX_FILES) return fail(t.errorFiles);

    const turnstileToken = text("cf-turnstile-response");
    if (!turnstileToken) return fail(t.errorVerification);

    setStatus("sending");
    setError("");
    setUploading(files.length > 0);
    const first = await post("/submit", {
      name: text("name"),
      company: text("company"),
      email: text("email"),
      country: text("country"),
      projectType: text("project_type"),
      message: text("message"),
      filesLink: text("files_link"),
      website: text("website"),
      elapsedMs,
      turnstileToken,
      files: files.map((f) => ({ name: f.name, size: f.size })),
    });
    if (!first.ok) {
      const code = first.json.error;
      return fail(code === "invalid" ? t.errorRequired : code === "files" ? t.errorFiles : code === "verification" ? t.errorVerification : t.errorGeneric);
    }

    if (files.length > 0) {
      const { id, uploads } = first.json;
      if (!id || !uploads || uploads.length !== files.length) return fail(t.errorGeneric);
      try {
        const sent = await Promise.all(
          files.map((file, i) => {
            const body = new FormData();
            for (const [k, v] of Object.entries(uploads[i].fields)) body.append(k, v);
            body.append("file", file); // S3 requires the file to be the last field.
            return fetch(uploads[i].url, { method: "POST", body });
          }),
        );
        if (sent.some((r) => !r.ok)) return fail(t.errorFiles);
      } catch {
        return fail(t.errorGeneric);
      }
      const done = await post("/complete", { id });
      if (!done.ok) return fail(done.json.error === "files" ? t.errorFiles : t.errorGeneric);
    }

    setStatus("ok");
    window.gtag?.("event", "generate_lead", { form_id: "contact", site: "formworkforconcrete.com" });
  }

  if (status === "ok") {
    return (
      <p role="status" className="border-l-4 border-accent bg-paper p-8 text-[18px] font-bold text-ink">
        {t.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
      {configured && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />}
      <label className={field}>
        {t.name}
        <input name="name" type="text" required autoComplete="name" maxLength={120} className={input} />
      </label>
      <label className={field}>
        {t.company}
        <input name="company" type="text" autoComplete="organization" maxLength={160} className={input} />
      </label>
      <label className={`${field} col-span-full`}>
        {t.email}
        <input name="email" type="email" required autoComplete="email" maxLength={160} className={input} />
      </label>
      <label className={field}>
        {t.country}
        <input name="country" type="text" autoComplete="country-name" maxLength={80} className={input} />
      </label>
      <label className={field}>
        {t.projectType}
        <select name="project_type" defaultValue="" className={input}>
          <option value="" disabled hidden />
          {t.projectTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className={`${field} col-span-full`}>
        {t.message}
        <span id="message-hint" className="text-[13px] font-normal text-muted">
          {t.messageHint}
        </span>
        <textarea name="message" required rows={6} maxLength={5000} aria-describedby="message-hint" className={`${input} resize-y`} />
      </label>
      <label className="col-span-full flex cursor-pointer flex-col items-center gap-1.5 border border-dashed border-muted p-5 text-center text-[15px] font-bold text-ink">
        {t.files}
        <span id="files-hint" className="text-[13px] font-normal text-muted">
          {t.filesHint}
        </span>
        <input name="files" type="file" multiple accept={ALLOWED.map((e) => `.${e}`).join(",")} aria-describedby="files-hint" className="max-w-full text-[13px] font-normal" />
      </label>
      <label className={`${field} col-span-full`}>
        {t.filesLink}
        <span id="files-link-hint" className="text-[13px] font-normal text-muted">
          {t.filesLinkHint}
        </span>
        <input name="files_link" type="url" inputMode="url" placeholder="https://" maxLength={500} pattern="https://.+" aria-describedby="files-link-hint" className={input} />
      </label>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {configured && <div ref={widgetBox} className="col-span-full" />}

      <div className="col-span-full">
        <button type="submit" disabled={!configured || status === "sending"} className="min-h-[56px] w-full bg-ink p-4 text-[14px] font-bold uppercase tracking-[0.14em] text-white hover:bg-charcoal disabled:opacity-60 md:w-auto md:px-14">
          {status === "sending" ? t.sending : t.submit}
        </button>
        {!configured && (
          <p className="mt-5 text-[15px] text-muted">
            {t.unavailable}{" "}
            <a href={`mailto:${company.email}`} className="font-bold text-ink underline decoration-accent underline-offset-4 [overflow-wrap:anywhere]">
              {company.email}
            </a>
            .
          </p>
        )}
        {status === "sending" && uploading && (
          <p role="status" className="mt-5 text-[15px] text-muted">
            {t.uploading}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 p-4 text-[15px] text-red-900">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
