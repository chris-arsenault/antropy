# Native server: operator credential for Komodo, plus a public spectator route.
resource "random_password" "operator" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "operator" {
  name  = "/ahara/${local.prefix}/operator-token"
  type  = "SecureString"
  value = random_password.operator.result
}

module "ctx" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/platform-context"
}

data "aws_lb_target_group" "reverse_proxy" {
  name = "ahara-proxy-tg"
}

# Shared ALB -> ahara-infra nginx upstream -> WireGuard -> TrueNAS port 8095.
# Only the spectator WebSocket and health summary are forwarded. Every other path,
# including the /api management surface and the bundled UI, falls through to the
# listener's default 404, so operator management stays reachable only on the LAN.
# Operator controls on /stream still require the operator token.
module "server_route" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/alb-api-truenas"

  hostname         = local.server_hostname
  alb              = module.ctx.alb
  target_group_arn = data.aws_lb_target_group.reverse_proxy.arn

  routes = [
    { priority = 250, paths = ["/stream"], methods = ["GET"], authenticated = false },
    { priority = 251, paths = ["/health"], methods = ["GET", "HEAD"], authenticated = false },
  ]
}
