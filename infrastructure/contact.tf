# The contact service: one Lambda behind a function URL (code in services/contact, bundled with `pnpm form:build`).

data "archive_file" "contact" {
  type        = "zip"
  source_file = "${path.module}/../services/contact/dist/index.mjs"
  output_path = "${path.module}/.build/contact.zip"
}

resource "aws_cloudwatch_log_group" "contact" {
  name              = "/aws/lambda/${var.project}-contact"
  retention_in_days = 90

  tags = local.common_tags
}

data "aws_iam_policy_document" "contact_trust" {
  statement {
    sid     = "AllowLambdaToAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "contact" {
  name               = "${var.project}-contact-lambda"
  description        = "Runtime role of the formworkforconcrete.com contact service"
  assume_role_policy = data.aws_iam_policy_document.contact_trust.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "contact_permissions" {
  statement {
    sid       = "WriteOwnLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.contact.arn}:*"]
  }

  # The sender address is read from the secret, so the allowed From addresses are limited to the mail domain.
  statement {
    sid       = "SendMailFromOwnDomain"
    effect    = "Allow"
    actions   = ["ses:SendEmail"]
    resources = [aws_sesv2_email_identity.contact.arn]

    condition {
      test     = "StringLike"
      variable = "ses:FromAddress"
      values   = ["*@${var.mail_domain}"]
    }
  }

  statement {
    sid       = "ReadContactSecret"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.contact.arn]
  }

  # Without ListBucket S3 answers "access denied" instead of "not found" for a missing key, which the
  # service treats as an error.
  statement {
    sid       = "ListUploadPrefixes"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.uploads.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["incoming/*", "submissions/*"]
    }
  }

  statement {
    sid     = "ReadWriteUploads"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = [
      "${aws_s3_bucket.uploads.arn}/incoming/*",
      "${aws_s3_bucket.uploads.arn}/submissions/*",
    ]
  }
}

resource "aws_iam_role_policy" "contact" {
  name   = "contact-service"
  role   = aws_iam_role.contact.id
  policy = data.aws_iam_policy_document.contact_permissions.json
}

resource "aws_lambda_function" "contact" {
  function_name = "${var.project}-contact"
  description   = "formworkforconcrete.com contact form: validation, Turnstile, S3 uploads, SES mail"
  role          = aws_iam_role.contact.arn

  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  handler       = "index.handler"
  memory_size   = 256
  timeout       = 20

  filename         = data.archive_file.contact.output_path
  source_code_hash = data.archive_file.contact.output_base64sha256

  environment {
    variables = {
      SECRET_ARN      = aws_secretsmanager_secret.contact.arn
      UPLOAD_BUCKET   = aws_s3_bucket.uploads.bucket
      ALLOWED_ORIGINS = join(",", local.allowed_origins)
      CONTACT_TO      = var.contact_to_email
      CONTACT_FROM    = var.contact_from_email
    }
  }

  tags = local.common_tags

  depends_on = [aws_cloudwatch_log_group.contact, aws_iam_role_policy.contact]
}

# Public URL. The service itself checks the Origin header, Turnstile and the other spam rules.
resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = local.allowed_origins
    allow_methods = ["GET", "POST"]
    allow_headers = ["content-type"]
    max_age       = 3600
  }
}

# A public function URL needs both permissions.
resource "aws_lambda_permission" "url_invoke_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.contact.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "url_invoke_function" {
  statement_id             = "AllowPublicFunctionUrlInvoke"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.contact.function_name
  principal                = "*"
  invoked_via_function_url = true
}
