variable "aws_account_id" {
  description = "AWS account shared with the oceanbimcloud and oceanbim.com stacks."
  type        = string
  default     = "379995599931"
}

variable "aws_region" {
  description = "Region for every resource of this site, same as the oceanbimcloud and oceanbim.com stacks."
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  description = "Local AWS CLI profile. Override or remove through CI as needed."
  type        = string
  default     = "rfm-aws-manage"
}

variable "project" {
  description = "Prefix of every resource name created by this stack."
  type        = string
  default     = "formworkforconcrete-com"
}

variable "amplify_app_id" {
  description = "ID of the Amplify app created in the console (connected to GitHub). Leave null to skip the Amplify resources."
  type        = string
  default     = "d26eoc1yza6uci"
  nullable    = true
}

variable "amplify_app_name" {
  description = "Amplify application name, as created in the console."
  type        = string
  default     = "formworkforconcrete.com"
}

variable "amplify_repository" {
  description = "Git repository connected to Amplify through the GitHub app."
  type        = string
  default     = "https://github.com/tranductrungxd/formworkforconcrete.com"
}

variable "amplify_service_role_arn" {
  description = "Service role Amplify attached to the app when it was created in the console, if any (changing it forces a new app). Not needed by a static site; set it from the app's settings before adopting the app so the import does not replace it."
  type        = string
  default     = "arn:aws:iam::379995599931:role/service-role/AmplifySSRLoggingRole-cf437283-855c-45ba-92b5-b525143d8584"
  nullable    = true
}

variable "amplify_branch_name" {
  description = "Production Git and Amplify branch."
  type        = string
  default     = "main"
}

variable "cloudinary_cloud_name" {
  description = "Public Cloudinary cloud name used to build image URLs. The shared \"oceanbim\" cloud; this site's images live in its formworkforconcrete.com/ folder."
  type        = string
  default     = "oceanbim"
}

variable "turnstile_site_key" {
  description = "Public Cloudflare Turnstile site key of the formworkforconcrete.com widget (public by design). Empty keeps the form disabled (it shows the email address instead)."
  type        = string
  default     = "0x4AAAAAAFPT7o8CrqUSUwyG"
}

variable "contact_allowed_origins" {
  description = "Exact browser origins allowed to use the contact service and to upload to S3. Includes the Amplify preview address for testing."
  type        = set(string)
  default     = ["https://formworkforconcrete.com", "https://main.d26eoc1yza6uci.amplifyapp.com"]
}

variable "contact_secret_name" {
  description = "Secrets Manager container name. The secret value is managed out of band."
  type        = string
  default     = "formworkforconcrete-com"
}

variable "mail_domain" {
  description = "Domain verified in SES. The contact service may only send from addresses on it."
  type        = string
  default     = "formworkforconcrete.com"
}

variable "contact_to_email" {
  description = "Address that receives the enquiries. Not a secret, so it is a plain Lambda setting. OWNER TO CONFIRM (plan section 7); never contacts@oceanbimcloud.com, that domain has no MX record."
  type        = string
  default     = "contact@formworkforconcrete.com"

  validation {
    condition     = can(regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", var.contact_to_email))
    error_message = "contact_to_email must be a valid email address."
  }
}

variable "contact_from_email" {
  description = "Sender address of the notification mails. Must be on mail_domain, the domain verified in SES (the Lambda role may only send from it)."
  type        = string
  default     = "forms@formworkforconcrete.com"

  validation {
    condition     = endswith(lower(var.contact_from_email), "@${var.mail_domain}")
    error_message = "contact_from_email must be an address on mail_domain."
  }
}

variable "uploads_retention_days" {
  description = "Days a submission and its files are kept in S3 before they are deleted."
  type        = number
  default     = 365
}

variable "custom_domain_name" {
  description = "Amplify custom domain. Registering it only requests the SSL certificate and shows the DNS records; visitors are not affected until the DNS records are changed. Also switches on the www to apex redirect. Set for the cutover (2026-10-06)."
  type        = string
  default     = "formworkforconcrete.com"
  nullable    = true
}
