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
