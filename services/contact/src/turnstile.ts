// Cloudflare Turnstile check, the same rules as the oceanbim.com site: the token must be valid, solved on
// the page the request came from, and created by a widget with action "contact".

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
}

export async function verifyTurnstile(
  fetchFn: typeof fetch,
  { secret, token, expectedHostname }: { secret: string; token: string; expectedHostname: string },
): Promise<boolean> {
  try {
    const res = await fetchFn(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as TurnstileResponse;
    return result.success === true && result.hostname === expectedHostname && result.action === "contact";
  } catch {
    return false;
  }
}
