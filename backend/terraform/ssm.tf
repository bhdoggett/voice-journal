data "aws_ssm_parameter" "gemini_api_key" {
  name = "GEMINI_API_KEY"
}

resource "aws_ssm_parameter" "gemini_api_key" {
  name  = "GEMINI_API_KEY"
  type  = "String"
  value = data.aws_ssm_parameter.gemini_api_key.value
}
