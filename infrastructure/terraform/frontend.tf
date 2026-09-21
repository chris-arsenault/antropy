module "frontend" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website"

  prefix                     = local.prefix
  hostname                   = local.frontend_hostname
  site_directory             = "${path.module}/../../frontend/dist"
  response_headers_policy_id = aws_cloudfront_response_headers_policy.isolation.id
}

resource "aws_cloudfront_response_headers_policy" "isolation" {
  name = "${local.prefix}-cross-origin-isolation"

  custom_headers_config {
    items {
      header   = "Cross-Origin-Opener-Policy"
      value    = "same-origin"
      override = true
    }
    items {
      header   = "Cross-Origin-Embedder-Policy"
      value    = "require-corp"
      override = true
    }
  }
}
