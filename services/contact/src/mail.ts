import type { Submission } from "./validate.ts";

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
    "",
    s.message,
  ].filter((l): l is string => l !== null);

  if (links.length > 0) {
    const total = links.reduce((n, l) => n + l.file.size, 0);
    lines.push("", `Files (${links.length}, ${mb(total)}). The links work for 30 days:`);
    for (const { file, url } of links) lines.push(`- ${file.name} (${mb(file.size)})`, `  ${url}`);
  }
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
