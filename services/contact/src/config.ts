import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

/** The two real secrets. They live in one Secrets Manager JSON secret, set by hand and never in Terraform state.
 * Mail is sent through SES with the Lambda role, so there is no mail API key. */
export interface Config {
  turnstileSecret: string;
  /** Random string (openssl rand -hex 32) that signs the file download links. */
  downloadSigningKey: string;
}

/** Plain settings (environment variables set by Terraform), not secrets. */
export interface MailAddresses {
  /** Where enquiries are delivered. */
  to: string;
  /** Sender address on the domain verified in SES (infrastructure/ses.tf). */
  from: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CACHE_MS = 5 * 60 * 1000;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function parseConfig(value: unknown): Config | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  const config = { turnstileSecret: text(r.turnstileSecret), downloadSigningKey: text(r.downloadSigningKey) };
  if (!config.turnstileSecret || config.downloadSigningKey.length < 32) return null;
  return config;
}

/** Reads CONTACT_TO / CONTACT_FROM. Throws at start-up when one is missing or malformed, so a bad setting is loud. */
export function parseMailAddresses(to: string | undefined, from: string | undefined): MailAddresses {
  const t = text(to);
  const f = text(from);
  if (!EMAIL_RE.test(t)) throw new Error("CONTACT_TO is not a valid email address");
  if (!EMAIL_RE.test(f)) throw new Error("CONTACT_FROM is not a valid email address");
  return { to: t, from: f };
}

/** Reads the secret on first use and again every five minutes. */
export function secretsConfigLoader(secretArn: string): () => Promise<Config | null> {
  const client = new SecretsManagerClient({ maxAttempts: 2 });
  let cached: { value: Config; expiresAt: number } | null = null;

  return async () => {
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const result = await client.send(new GetSecretValueCommand({ SecretId: secretArn }), { abortSignal: AbortSignal.timeout(5_000) });
      const value = result.SecretString ? parseConfig(JSON.parse(result.SecretString)) : null;
      if (value) cached = { value, expiresAt: Date.now() + CACHE_MS };
      return value;
    } catch {
      return null;
    }
  };
}
