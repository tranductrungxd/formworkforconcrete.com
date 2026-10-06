resource "aws_secretsmanager_secret" "contact" {
  name                    = var.contact_secret_name
  description             = "formworkforconcrete.com contact form: Turnstile secret and download-link signing key"
  recovery_window_in_days = 30

  tags = local.common_tags

  # Secret values are deliberately not represented by an aws_secretsmanager_secret_version resource.
  # Terraform state must never hold the Turnstile secret or the signing key.
  lifecycle {
    prevent_destroy = true
  }
}
