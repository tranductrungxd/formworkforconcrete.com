import type { SourceField, Submission } from "./validate.ts";

const SOURCE_LABELS: Record<SourceField, string> = {
  landing: "Landing page",
  referrer: "Referrer",
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmTerm: "utm_term",
  utmContent: "utm_content",
  ctaPage: "Quote button clicked on",
};

export interface StoredFile {
  name: string;
  size: number;
  key: string;
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Plain-text notification with links to the uploaded files. */
export function buildEmail(s: Submission, links: { file: StoredFile; url: string }[]) {
  const lines = [
    `Name: ${s.name}`,
    s.company ? `Company: ${s.company}` : null,
    `Email: ${s.email}`,
    s.country ? `Country: ${s.country}` : null,
    s.projectType ? `Project type: ${s.projectType}` : null,
    s.filesLink ? `Link to files: ${s.filesLink}` : null,
    "",
    s.message,
  ].filter((l): l is string => l !== null);

  if (links.length > 0) {
    const total = links.reduce((n, l) => n + l.file.size, 0);
    lines.push("", `Files (${links.length}, ${mb(total)}). The links work for 30 days:`);
    for (const { file, url } of links) lines.push(`- ${file.name} (${mb(file.size)})`, `  ${url}`);
  }
  const source = Object.entries(s.source ?? {}) as [SourceField, string][];
  lines.push("", "Source of the visit:");
  if (source.length === 0) lines.push("- unknown (direct visit, or the browser blocks storage)");
  for (const [k, v] of source) lines.push(`- ${SOURCE_LABELS[k]}: ${v}`);
  lines.push("", "---", "Sent from the contact form on formworkforconcrete.com");

  return {
    subject: oneLine(`[Formwork for Concrete] New enquiry from ${s.name}${s.company ? ` (${s.company})` : ""}`),
    text: lines.join("\n"),
  };
}

/** Sends one plain-text message. Returns false instead of throwing, so the handler can answer with an error. */
export interface Mailer {
  send(mail: { from: string; to: string; replyTo: string; subject: string; text: string }): Promise<boolean>;
}
