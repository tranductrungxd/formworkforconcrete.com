output "contact_function_url" {
  description = "Public URL of the contact service. Already passed to the Amplify build as NEXT_PUBLIC_FORM_ENDPOINT."
  value       = aws_lambda_function_url.contact.function_url
}

output "contact_secret_arn" {
  description = "Set this secret's value through the AWS console after creation (see README)."
  value       = aws_secretsmanager_secret.contact.arn
}

output "uploads_bucket" {
  description = "Private bucket for form uploads and stored enquiries."
  value       = aws_s3_bucket.uploads.bucket
}

output "ses_dkim_cname_records" {
  description = "Publish these three CNAME records in the DNS zone so SES verifies the domain."
  value = [
    for token in aws_sesv2_email_identity.contact.dkim_signing_attributes[0].tokens : {
      name  = "${token}._domainkey.${var.mail_domain}"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

output "contact_lambda_role_arn" {
  description = "Runtime role of the contact service."
  value       = aws_iam_role.contact.arn
}

output "amplify_default_domain" {
  description = "Amplify-generated hostname, once the app is adopted."
  value       = one(aws_amplify_app.this[*].default_domain)
}

locals {
  amplify_domain = one(aws_amplify_domain_association.custom[*])
  # "_abc.formworkforconcrete.com. CNAME _def.acm-validations.aws." (empty for a moment after the domain is added)
  amplify_cert_record = try(regex("^(\\S+)\\s+CNAME\\s+(\\S+)$", trimspace(local.amplify_domain.certificate_verification_dns_record)), null)
}

output "amplify_dns_records" {
  description = "The records to publish in Squarespace Domains (DNS Settings, Custom records), in its terms: Name without the domain, Data without the final dot. The certificate record first; the @ and www records are the cutover."
  value = local.amplify_domain == null ? null : concat(
    local.amplify_cert_record == null ? [] : [{
      purpose = "SSL certificate validation (no effect on visitors)"
      type    = "CNAME"
      name    = trimsuffix(local.amplify_cert_record[0], ".${var.custom_domain_name}.")
      data    = trimsuffix(local.amplify_cert_record[1], ".")
    }],
    [for s in local.amplify_domain.sub_domain : {
      purpose = "cutover: replaces the A record of ${s.prefix == "" ? "@" : s.prefix}"
      type    = s.prefix == "" ? "ALIAS" : "CNAME"
      name    = s.prefix == "" ? "@" : s.prefix
      data    = trimsuffix(try(regex("CNAME\\s+(\\S+)", s.dns_record)[0], ""), ".")
    }],
  )
}
