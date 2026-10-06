# Private bucket for the drawings visitors attach to the contact form, plus the stored enquiry records.
#
#   incoming/<id>/     browser uploads that are not confirmed yet; deleted after 2 days
#   submissions/<id>/  confirmed files and submission.json; deleted after var.uploads_retention_days

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project}-uploads-${var.aws_account_id}"

  tags = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "expire-unconfirmed-uploads"
    status = "Enabled"

    filter {
      prefix = "incoming/"
    }

    expiration {
      days = 2
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 2
    }
  }

  rule {
    id     = "expire-submissions"
    status = "Enabled"

    filter {
      prefix = "submissions/"
    }

    expiration {
      days = var.uploads_retention_days
    }
  }
}

# Browsers upload straight to S3 with a presigned POST, so S3 must allow the site's origins.
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["POST"]
    allowed_origins = local.allowed_origins
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

data "aws_iam_policy_document" "uploads_tls_only" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.uploads.arn, "${aws_s3_bucket.uploads.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  policy = data.aws_iam_policy_document.uploads_tls_only.json

  depends_on = [aws_s3_bucket_public_access_block.uploads]
}
