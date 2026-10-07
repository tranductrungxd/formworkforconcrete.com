// Browser-side conversion tracking: GA4 events and the source of a visit, which travels with an enquiry.
// Client components only. Every storage access can fail (private mode, blocked storage), so all of it is best effort.

/** GA4 event. A no-op until gtag.js is there; its inline init queues commands before the script itself loads. */
export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  window.gtag?.("event", event, { page_path: window.location.pathname, ...params });
}

/** Where a visit came from: captured on the first page of a browser session, sent with the enquiry. */
export interface LeadSource {
  landing?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  /** The page whose quote button the visitor clicked last. */
  ctaPage?: string;
}

const KEY = "ffc-lead-source";

function read(): LeadSource {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as LeadSource;
  } catch {
    return {};
  }
}

function write(value: LeadSource) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the enquiry just goes without its source.
  }
}

/** Records the landing page, external referrer and UTM tags once per session. */
export function rememberLanding() {
  if (read().landing) return;
  const url = new URL(window.location.href);
  const q = (name: string) => url.searchParams.get(name) ?? undefined;
  let referrer: string | undefined;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    referrer = ref && ref.host !== url.host ? `${ref.origin}${ref.pathname}` : undefined;
  } catch {
    referrer = undefined;
  }
  write({
    landing: url.pathname,
    referrer,
    utmSource: q("utm_source"),
    utmMedium: q("utm_medium"),
    utmCampaign: q("utm_campaign"),
    utmTerm: q("utm_term"),
    utmContent: q("utm_content"),
  });
}

export function rememberCtaPage(path: string) {
  write({ ...read(), ctaPage: path });
}

export function readLeadSource(): LeadSource {
  return read();
}
