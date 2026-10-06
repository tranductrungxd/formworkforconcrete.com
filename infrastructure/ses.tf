# Outgoing mail for the contact service, through Amazon SES in the same region.
#
# Terraform creates the domain identity and turns on Easy DKIM. Publish the three CNAME records from the
# `ses_dkim_cname_records` output in the DNS zone of the domain (Google Cloud DNS); SES then shows the identity as
# verified. They do not touch the existing mail (MX), SPF or DMARC records.
#
# A new SES account starts in the sandbox: it may only send to verified identities, and every address on a verified
# domain counts, so notifications to contact@formworkforconcrete.com work without asking AWS for production access.

resource "aws_sesv2_email_identity" "contact" {
  email_identity = var.mail_domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }

  tags = local.common_tags
}
