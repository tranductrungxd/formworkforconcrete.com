locals {
  common_tags = {
    Application = var.project
    ManagedBy   = "Terraform"
  }

  allowed_origins = sort(tolist(var.contact_allowed_origins))
  has_amplify_app = var.amplify_app_id != null

  # Public, non-secret settings. They are inlined into the static build, so a change needs a new Amplify build.
  amplify_environment_variables = {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = var.cloudinary_cloud_name
    NEXT_PUBLIC_FORM_ENDPOINT         = aws_lambda_function_url.contact.function_url
    NEXT_PUBLIC_TURNSTILE_SITE_KEY    = var.turnstile_site_key
  }
}
