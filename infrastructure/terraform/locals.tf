locals {
  project           = "antropy"
  prefix            = "antropy"
  aws_region        = "us-east-1"
  frontend_hostname = "antropy.ahara.io"

  default_tags = {
    Project   = local.project
    ManagedBy = "Terraform"
  }
}
