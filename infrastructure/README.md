# formworkforconcrete.com infrastructure

Terraform for the AWS side of formworkforconcrete.com. It follows the layout of the `oceanbim.com` and `oceanbimcloud`
stacks: same pinned Terraform and provider versions, same account (`379995599931`), region (`ap-southeast-1`) and CLI
profile (`rfm-aws-manage`), the same "secret values never enter Terraform" rule. **Applied on 2026-10-06 with the `oceanbim-admin` profile:** the whole stack
(bucket, Lambda and function URL, role, SES identity, secret) and the adoption of the Amplify app `d26eoc1yza6uci` (platform `WEB`,
44 redirect rules, build variables). State is local in `infrastructure/terraform.tfstate` (gitignored). The first preview build
(`https://main.d26eoc1yza6uci.amplifyapp.com`) passed `pnpm seo:check --redirects`; open points are the SES DNS records and the
Turnstile hostnames (below). Do `terraform plan` before every further apply.

| File | Creates |
|---|---|
| `uploads.tf` | Private S3 bucket `formworkforconcrete-com-uploads-<account>`: no public access, encrypted, TLS only, CORS for browser uploads, `incoming/` deleted after 2 days, `submissions/` after 365 days. |
| `secrets.tf` | Empty Secrets Manager container `formworkforconcrete-com` (you fill it in, see below). |
| `contact.tf` | Lambda `formworkforconcrete-com-contact` (code: `services/contact`), its least-privilege role, 90-day log group, public function URL. |
| `ses.tf` | Amazon SES domain identity for `formworkforconcrete.com` with DKIM. The Lambda may send only from addresses on that domain. |
| `amplify.tf`, `imports.tf` | The Amplify app settings, `main` branch and optional custom domain. **Skipped until `amplify_app_id` is set**, because the app is created in the console. |
| `redirects.tf` | The 44 redirect rules that replace the old `.htaccess`: the 15 legacy URLs of `seo-baseline/redirects.formworkforconcrete.com.csv` (with and without the trailing slash, except `.xml` files) and a slash-less 301 for each of the 19 kept pages (as the old site did; `/projects` has Search Console impressions). Plus www to apex once the domain is set (45 in total; oceanbim.com's live app runs 49). |

Why a static site plus a Lambda, and not the server-side Amplify hosting: Amplify's SSR hosting officially supports Next.js 12
to 15 and this site is on 16; the pages need no server anyway. The Hostinger PHP form of the plan cannot run on Amplify, so
the form uses the same Lambda service as oceanbim.com.

## Before anything: decisions that are the owner's

| # | What | Default in the code |
|---|---|---|
| 1 | **Recipient of the enquiries** (`contact_to_email`). Never `contacts@oceanbimcloud.com` (that domain has no MX record). | `contact@formworkforconcrete.com`, the address shown on the site. **Blocks launch until confirmed.** |
| 2 | Sender address (`contact_from_email`), any address on the SES domain; it needs no mailbox. | `forms@formworkforconcrete.com` |
| 3 | GitHub repository connected to Amplify (`amplify_repository`). | `https://github.com/tranductrungxd/formworkforconcrete.com` (a guess from oceanbim.com; the repo does not exist yet) |
| 4 | The Cloudflare Turnstile widget for `formworkforconcrete.com`: it must list the Amplify preview host as well while testing. Its public site key (`0x4AAAAAAFPT7o8CrqUSUwyG`) is the default of `turnstile_site_key`; the secret goes into Secrets Manager (step 3b). | site key set; the secret is still to be entered |

## Safety decisions

- Never commit `terraform.tfstate`, plans, `terraform.tfvars` or `backend.hcl` (all in `.gitignore`).
- The secret value is entered in the AWS console (or with `scripts/set-turnstile-secret.sh`), never in Terraform.
- The bucket, the secret and the Amplify resources use `prevent_destroy`.
- Nothing here touches the resources of the oceanbimcloud or oceanbim.com stacks (separate state, separate names).

## 1. Let an administrator allow the operator (once)

The `rfm-aws-manage` user is limited to the existing stacks' resources, so it cannot create these. Either run Terraform with an
administrator profile (`-var aws_profile=<admin>`) or attach the scoped policy (replace `REPLACE_WITH_AMPLIFY_APP_ID` in the
file once the app exists):

```bash
aws iam put-user-policy --user-name rfm-aws-manage --policy-name formworkforconcrete-com-bootstrap-policy \
  --policy-document file://required-operator-policy.json --profile <administrator-profile>
```

The policy is written from what Terraform calls for these resources; if `apply` reports `AccessDenied` for an action, add it
to the file.

## 2. Create the service

```bash
cd .. && pnpm form:test && pnpm form:build      # bundles services/contact/dist/index.mjs
cd infrastructure
export AWS_PROFILE=rfm-aws-manage AWS_REGION=ap-southeast-1
terraform init
terraform plan
terraform apply
```

Re-run `pnpm form:build` before every apply: Terraform zips the bundle, and a changed bundle redeploys the Lambda.

## 3. Mail through SES (DNS records, once)

`terraform apply` creates the SES identity for `formworkforconcrete.com`. Publish the three CNAME records from the
`ses_dkim_cname_records` output in the DNS settings of the domain (`terraform output ses_dkim_cname_records`). **Check the Host field:**
some panels append the domain themselves, so enter `<token>._domainkey` and not the full name (otherwise the record ends up as
`<token>._domainkey.formworkforconcrete.com.formworkforconcrete.com` and SES stays `PENDING`; test with `dig +short CNAME <token>._domainkey.formworkforconcrete.com`). They do not touch
the existing mail (MX → Hostinger), SPF or DMARC records. SES then shows the identity as **Verified** (a few minutes to a few
hours; check with `aws sesv2 get-email-identity --email-identity formworkforconcrete.com`).

- **Sandbox:** a new SES account may only send to verified identities, and every address on a verified domain counts, so
  notifications to `contact@formworkforconcrete.com` work right away. If SES refuses the recipient, verify the address itself
  as an email identity, or request production access in the SES console.
- **No API key:** the Lambda role sends with `ses:SendEmail`, limited to `*@formworkforconcrete.com`.

## 3b. Fill in the secret (AWS console, Secrets Manager, `formworkforconcrete-com`)

The secret exists and `downloadSigningKey` is already set (generated, never shown). **Only `turnstileSecret` is still empty**: paste the
widget's secret key there, or run `./scripts/set-turnstile-secret.sh`. Plain-text JSON with these exact keys:

```json
{
  "turnstileSecret": "<Turnstile secret of the formworkforconcrete.com widget>",
  "downloadSigningKey": "<output of: openssl rand -hex 32>"
}
```

Easiest for the Turnstile secret: `./scripts/set-turnstile-secret.sh` (hidden input, keeps the other keys). The widget must
list every hostname the form runs on: `formworkforconcrete.com` and the Amplify preview host `main.d26eoc1yza6uci.amplifyapp.com`
(otherwise the widget fails with error 110200 and the form cannot be submitted there). `downloadSigningKey` signs the file links in the
notification mails; changing it invalidates links already sent.

## 4. The Amplify app

1. In the Amplify console (Singapore), create the app from the GitHub repo and the `main` branch. Amplify guesses "Next.js
   SSR" (`WEB_COMPUTE`) and its first build fails; that is expected, Terraform corrects it.
2. Put the app id into `amplify_app_id` and run `terraform plan`. It imports the app and branch, switches the platform to
   `WEB`, sets the three `NEXT_PUBLIC_*` build variables (the Lambda URL, the Turnstile site key, the Cloudinary name) and
   replaces Amplify's default rule with the redirects. If the console attached a service role to the app, put its ARN into
   `amplify_service_role_arn` first; removing it forces Terraform to replace the app (`prevent_destroy` stops that).
3. Add `https://main.<app-id>.amplifyapp.com` to `contact_allowed_origins` (Lambda and S3 CORS) and to the Turnstile
   widget's hostnames, then apply and start a build (`aws amplify start-job --app-id <id> --branch-name main --job-type RELEASE`)
   so the variables are inlined into the static export. Later pushes to `main` build automatically.
4. After the first build run `pnpm media:warm` (it pre-generates the Cloudinary image variants of the pages).
5. **Test on the preview URL** (this replaces the `next.formworkforconcrete.com` staging subdomain of the plan): the form with
   and without files, `pnpm seo:check https://main.<app-id>.amplifyapp.com --redirects` and `pnpm gsc:check https://main.<app-id>.amplifyapp.com --redirects`
   (every URL of the Search Console export, including the slash-less redirects), the 404 page, the headers.
   Canonicals point at the production domain, so the preview does not compete with it in search, but it has no `noindex`.

## 5. Go live (cutover)

The plan assumed "the cutover changes no DNS". With Amplify it does: the website records move from Hostinger to Amplify.

1. **Before:** the Search Console export of the old site is saved (done: 2026-10-06, `pnpm gsc:check` shows no URL with traffic would 404); the owner has approved the cutover time.
2. Set `custom_domain_name = "formworkforconcrete.com"` and apply. Amplify shows the DNS records it needs (certificate validation
   CNAME and the target for the domain).
3. In Google Cloud DNS: the apex needs an `ALIAS`/`ANAME` record (Cloud DNS supports it through `gcloud` or the API, not the
   console) or the DNS zone moves to Route 53; `www` gets a CNAME. **Keep the MX records (Hostinger mail), SPF/DKIM and every
   other record exactly as they are.**
4. After DNS propagates: `pnpm seo:check https://formworkforconcrete.com --redirects`, submit `/sitemap.xml` in Search Console and
   request indexing for `/`, `/contact-us/` and `/projects/`, watch the Pages report and the 404s daily for 2 weeks, then weekly
   until week 6, and compare GA4 traffic with the weeks before.
5. **Rollback:** point the DNS records back to Hostinger. Keep the WordPress site and its database there for at least 60 days
   and delete them only with the owner's approval.

## Costs

Everything here is pay-per-use and tiny at contact-form volume (Lambda, S3, SES at about 0.10 USD per 1,000 mails, Secrets
Manager at about 0.40 USD per month, CloudWatch logs), plus Amplify build minutes and hosting traffic.

## State

State is local and ignored by Git, like the other stacks. To move it to a protected S3 bucket, copy `backend.s3.tf.example` to
`backend.tf`, `backend.hcl.example` to `backend.hcl`, and run `terraform init -migrate-state -backend-config=backend.hcl`.
