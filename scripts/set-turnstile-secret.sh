#!/usr/bin/env bash
# Stores the Cloudflare Turnstile SECRET key in the formworkforconcrete-com Secrets Manager secret.
# The key is typed hidden, never printed and never put on a command line; the other keys of the secret are kept.
#
#   ./scripts/set-turnstile-secret.sh
#
# Environment overrides: TURNSTILE_SITE_KEY (the public key, to catch a paste of the wrong one), AWS_PROFILE (default oceanbim-admin), AWS_REGION (ap-southeast-1), SECRET_ID (formworkforconcrete-com).
set -euo pipefail

PROFILE="${AWS_PROFILE:-oceanbim-admin}"
REGION="${AWS_REGION:-ap-southeast-1}"
SECRET_ID="${SECRET_ID:-formworkforconcrete-com}"
SITE_KEY="${TURNSTILE_SITE_KEY:-0x4AAAAAAFPT7o8CrqUSUwyG}" # the public key of the widget; pasting it here by mistake is refused

read -rsp "Paste the Turnstile SECRET key (input is hidden), then press Enter: " KEY
echo
KEY="${KEY//[$' \t\r\n']/}"
if [[ -z "$KEY" ]]; then echo "Nothing entered." >&2; exit 1; fi
if [[ -n "$SITE_KEY" && "$KEY" == "$SITE_KEY" ]]; then echo "That is the public SITE key. The SECRET key is the other one in Cloudflare." >&2; exit 1; fi
if [[ ${#KEY} -lt 30 ]]; then
  read -rp "Secret keys are normally about 35 characters; this one has ${#KEY}. Save it anyway? [y/N] " ok
  [[ "$ok" == "y" || "$ok" == "Y" ]] || exit 1
fi

CURRENT="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --profile "$PROFILE" --region "$REGION" --query SecretString --output text)"

umask 077
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
CURRENT="$CURRENT" KEY="$KEY" python3 -c 'import json, os; d = json.loads(os.environ["CURRENT"]); d["turnstileSecret"] = os.environ["KEY"]; print(json.dumps(d))' > "$TMP"

aws secretsmanager put-secret-value --secret-id "$SECRET_ID" --secret-string "file://$TMP" \
  --profile "$PROFILE" --region "$REGION" --query VersionId --output text > /dev/null
echo "Saved. The contact service reads it within 5 minutes (it caches the secret)."
