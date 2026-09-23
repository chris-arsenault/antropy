locals {
  project           = "antropy"
  prefix            = "antropy"
  aws_region        = "us-east-1"
  frontend_hostname = "biotropy.ahara.io"
  server_hostname   = "server.biotropy.ahara.io"

  default_tags = {
    Project   = local.project
    ManagedBy = "Terraform"
  }
}
