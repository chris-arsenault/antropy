module "frontend" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website"

  prefix                     = local.prefix
  hostname                   = local.frontend_hostname
  site_directory             = "${path.module}/../../frontend/dist"
  response_headers_policy_id = aws_cloudfront_response_headers_policy.isolation.id
}

# Public visitors attach to the shared server world by default; ?execution=browser1|browser4
# still selects a local world. The container serves its own same-origin default.
resource "aws_s3_object" "execution_default" {
  bucket        = module.frontend.bucket_name
  key           = "execution.json"
  content       = jsonencode({ mode = "server", endpoint = "wss://${local.server_hostname}/stream" })
  content_type  = "application/json"
  cache_control = "no-cache"
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
