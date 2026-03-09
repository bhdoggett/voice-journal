data "aws_ssm_parameter" "gemini_api_key" {
  name = "GEMINI_API_KEY"
}

resource "aws_ssm_parameter" "gemini_api_key" {
  name  = "GEMINI_API_KEY"
  type  = "String"
  value = data.aws_ssm_parameter.gemini_api_key.value
}

resource "aws_ssm_parameter" "database_url" {
  name  = "VJ_DATABASE_URL"
  type  = "SecureString"
  value = "placeholder"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "better_auth_secret" {
  name  = "VJ_BETTER_AUTH_SECRET"
  type  = "SecureString"
  value = "placeholder"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "openai_api_key" {
  name  = "VJ_OPENAI_API_KEY"
  type  = "SecureString"
  value = "placeholder"
  lifecycle { ignore_changes = [value] }
}
