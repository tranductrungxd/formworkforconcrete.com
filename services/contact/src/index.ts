import { randomBytes } from "node:crypto";
import { parseMailAddresses, secretsConfigLoader } from "./config.ts";
import { createHandler } from "./handler.ts";
import { sesMailer } from "./ses.ts";
import { s3Store } from "./store.ts";

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

export const handler = createHandler({
  store: s3Store(env("UPLOAD_BUCKET")),
  loadConfig: secretsConfigLoader(env("SECRET_ARN")),
  addresses: parseMailAddresses(process.env.CONTACT_TO, process.env.CONTACT_FROM),
  mailer: sesMailer(),
  fetch,
  allowedOrigins: env("ALLOWED_ORIGINS").split(",").map((o) => o.trim()).filter(Boolean),
  now: Date.now,
  randomId: () => randomBytes(16).toString("hex"),
});
