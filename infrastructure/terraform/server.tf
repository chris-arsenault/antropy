# Private Komodo deployment only. No listener, DNS, proxy or VPN route is created here.
resource "random_password" "operator" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "operator" {
  name  = "/ahara/${local.prefix}/operator-token"
  type  = "SecureString"
  value = random_password.operator.result
}
