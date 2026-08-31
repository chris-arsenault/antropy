output "frontend_url" {
  description = "Public URL of the deployed site"
  value       = module.frontend.url
}

output "frontend_bucket_name" {
  description = "S3 bucket holding the site artifacts"
  value       = module.frontend.bucket_name
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend.distribution_id
}
