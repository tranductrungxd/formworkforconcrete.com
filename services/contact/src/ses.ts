import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { Mailer } from "./mail.ts";

/** Sends through Amazon SES in the Lambda's own region, using the function role (no API key). */
export function sesMailer(): Mailer {
  const client = new SESv2Client({ maxAttempts: 2 });

  return {
    async send({ from, to, replyTo, subject, text }) {
      try {
        await client.send(
          new SendEmailCommand({
            FromEmailAddress: from,
            Destination: { ToAddresses: [to] },
            ReplyToAddresses: [replyTo],
            Content: {
              Simple: {
                Subject: { Data: subject, Charset: "UTF-8" },
                Body: { Text: { Data: text, Charset: "UTF-8" } },
              },
            },
          }),
          { abortSignal: AbortSignal.timeout(10_000) },
        );
        return true;
      } catch (e) {
        // Only the error name is logged: messages can echo addresses typed by the visitor.
        console.error("SES send failed:", e instanceof Error ? e.name : "unknown");
        return false;
      }
    },
  };
}
