# The Amplify app is created once in the console (that is where the GitHub connection is authorised),
# then adopted here by setting var.amplify_app_id. Until then these resources are skipped, so the
# upload bucket, secret and contact service can be created first.
#
# The site is a static export (`output: "export"`, platform WEB). Amplify's server-side hosting officially
# supports Next.js 12 to 15 and this site is on 16, and the pages need no server anyway.

resource "aws_amplify_app" "this" {
  count = local.has_amplify_app ? 1 : 0

  name       = var.amplify_app_name
  repository = var.amplify_repository
  platform   = "WEB"

  build_spec           = replace(file("${path.module}/../amplify.yml"), "\r\n", "\n")
  iam_service_role_arn = var.amplify_service_role_arn

  enable_auto_branch_creation = false
  enable_branch_auto_build    = false
  enable_branch_auto_deletion = false
  enable_basic_auth           = false

  environment_variables = local.amplify_environment_variables

  cache_config {
    type = "AMPLIFY_MANAGED_NO_COOKIES"
  }

  dynamic "custom_rule" {
    for_each = local.redirect_rules

    content {
      source = custom_rule.value.source
      target = custom_rule.value.target
      status = custom_rule.value.status
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_branch" "main" {
  count = local.has_amplify_app ? 1 : 0

  app_id       = aws_amplify_app.this[0].id
  branch_name  = var.amplify_branch_name
  display_name = var.amplify_branch_name

  framework                   = "Web"
  stage                       = "PRODUCTION"
  enable_auto_build           = true
  enable_basic_auth           = false
  enable_notification         = false
  enable_performance_mode     = false
  enable_pull_request_preview = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_domain_association" "custom" {
  count = local.has_amplify_app && var.custom_domain_name != null ? 1 : 0

  app_id                 = aws_amplify_app.this[0].id
  domain_name            = var.custom_domain_name
  enable_auto_sub_domain = false
  # Do not wait for DNS: the records are published by hand in Google Cloud DNS, at cutover.
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = "www"
  }
}
