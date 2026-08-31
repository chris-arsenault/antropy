module "frontend" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website"

  prefix         = local.prefix
  hostname       = local.frontend_hostname
  site_directory = "${path.module}/../../frontend/dist"
}
